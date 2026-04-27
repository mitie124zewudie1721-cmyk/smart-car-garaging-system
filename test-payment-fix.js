// Quick test to verify payment initiation works
const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

async function testPaymentInitiation() {
    try {
        console.log('🧪 Testing Payment Initiation Fix...\n');

        // Step 1: Login as car owner
        console.log('1️⃣ Logging in as car owner...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'fasikaz',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Logged in successfully\n');

        // Step 2: Get user's reservations
        console.log('2️⃣ Fetching reservations...');
        const reservationsResponse = await axios.get(`${BASE_URL}/reservations/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const reservations = reservationsResponse.data.data;
        console.log(`✅ Found ${reservations.length} reservations\n`);

        if (reservations.length === 0) {
            console.log('❌ No reservations found. Please create a reservation first.');
            return;
        }

        // Find a confirmed reservation
        const reservation = reservations.find(r => r.status === 'confirmed');
        if (!reservation) {
            console.log('❌ No confirmed reservations found.');
            console.log('Available reservations:', reservations.map(r => ({
                id: r._id,
                status: r.status,
                serviceType: r.serviceType
            })));
            return;
        }

        console.log('📋 Using reservation:', {
            id: reservation._id,
            serviceType: reservation.serviceType,
            totalPrice: reservation.totalPrice,
            status: reservation.status
        });
        console.log('');

        // Step 3: Initiate payment
        console.log('3️⃣ Initiating payment...');
        const paymentResponse = await axios.post(`${BASE_URL}/payments/initiate`, {
            reservationId: reservation._id,
            paymentMethod: 'bank_transfer'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Payment initiated successfully!\n');
        console.log('💰 Payment Details:');
        console.log(JSON.stringify(paymentResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentInitiation();
