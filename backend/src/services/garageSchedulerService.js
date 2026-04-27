import Garage from '../models/Garage.js';
import Reservation from '../models/Reservation.js';
import logger from '../utils/logger.js';

const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function toMinutes(t) {
    if (!t || !t.includes(':')) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function getNow() {
    const now = new Date();
    return {
        dayName: DAYS[now.getDay()],
        currentMinutes: now.getHours() * 60 + now.getMinutes(),
    };
}

/**
 * Returns true = should be open, false = should be closed, null = no schedule (don't touch)
 */
function shouldBeOpen(garage) {
    const weekly = garage.operatingHours && garage.operatingHours.weekly;
    if (!weekly || Object.keys(weekly).length === 0) return null;

    const hasValidSchedule = Object.values(weekly).some(
        d => d && d.open === true && d.start && d.end && d.start !== '' && d.end !== ''
    );
    if (!hasValidSchedule) return null;

    const { dayName, currentMinutes } = getNow();
    const today = weekly[dayName];

    // Today is a closed day
    if (!today || today.open !== true || !today.start || !today.end) return false;

    const openMin = toMinutes(today.start);
    const closeMin = toMinutes(today.end);
    if (openMin === null || closeMin === null) return null;

    // Within open hours
    if (currentMinutes >= openMin && currentMinutes < closeMin) return true;

    // Before opening or after closing
    return false;
}

async function runSchedulerTick() {
    try {
        const garages = await Garage.find({
            verificationStatus: 'approved',
            'operatingHours.weekly': { $exists: true },
        }).select('_id name isActive operatingHours');

        let opened = 0, closed = 0;
        for (const garage of garages) {
            const open = shouldBeOpen(garage);
            if (open === null) continue;
            if (open && !garage.isActive) {
                await Garage.findByIdAndUpdate(garage._id, { isActive: true });
                opened++;
                logger.info('[Scheduler] Opened: ' + garage.name);
            } else if (!open && garage.isActive) {
                await Garage.findByIdAndUpdate(garage._id, { isActive: false });
                closed++;
                logger.info('[Scheduler] Closed: ' + garage.name);
            }
        }
        if (opened > 0 || closed > 0) {
            logger.info('[Scheduler] Tick: ' + opened + ' opened, ' + closed + ' closed');
        }
    } catch (err) {
        logger.error('[Scheduler] Error: ' + err.message);
    }
}

/**
 * Auto-mark confirmed reservations as no_show when arrivalDeadline has passed
 */
async function runNoShowTick() {
    try {
        const now = new Date();
        const expired = await Reservation.find({
            status: 'confirmed',
            arrivalDeadline: { $lt: now },
            arrivedAt: null,
        }).populate('garage', 'name owner');

        if (expired.length === 0) return;

        for (const reservation of expired) {
            reservation.status = 'no_show';
            reservation.autoNoShow = true;
            await reservation.save();
            logger.info('[Scheduler] Auto no-show: reservation ' + reservation._id);
        }

        logger.info('[Scheduler] Auto no-show tick: ' + expired.length + ' reservation(s) marked');
    } catch (err) {
        logger.error('[Scheduler] No-show tick error: ' + err.message);
    }
}

export function startGarageScheduler() {
    logger.info('[Scheduler] Garage auto open/close scheduler started');
    runSchedulerTick();
    setInterval(runSchedulerTick, 60 * 1000);

    runNoShowTick();
    setInterval(runNoShowTick, 60 * 1000);
}

export default startGarageScheduler;
