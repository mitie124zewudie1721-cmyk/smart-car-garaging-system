// src/components/car-owner/VehicleSelector.tsx
import { useState, useMemo } from 'react';
import Select from '@/components/common/Select';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { toast } from 'react-hot-toast';

interface Vehicle {
    _id: string;
    make: string;
    model: string;
    plateNumber: string;
    year?: number;
    color?: string;
}

interface VehicleSelectorProps {
    vehicles: Vehicle[];
    selectedVehicleId?: string;
    onSelect: (vehicleId: string) => void;
    onAddVehicle?: (newVehicle: Omit<Vehicle, '_id'>) => Promise<void> | void;
    isLoading?: boolean;
    error?: string | null;
}

export default function VehicleSelector({
    vehicles,
    selectedVehicleId,
    onSelect,
    onAddVehicle,
    isLoading = false,
    error = null,
}: VehicleSelectorProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        make: '',
        model: '',
        plateNumber: '',
        year: '',
        color: '',
    });

    // Memoized selected vehicle (avoid repeated .find())
    const selectedVehicle = useMemo(
        () => vehicles.find((v) => v._id === selectedVehicleId),
        [vehicles, selectedVehicleId]
    );

    const options = useMemo(
        () =>
            vehicles.map((v) => ({
                value: v._id,
                label: `${v.make} ${v.model} (${v.plateNumber})`,
            })),
        [vehicles]
    );

    const handleAddVehicle = async () => {
        if (!newVehicle.make || !newVehicle.model || !newVehicle.plateNumber) {
            toast.error('Please fill make, model, and plate number');
            return;
        }

        try {
            await onAddVehicle?.({
                make: newVehicle.make.trim(),
                model: newVehicle.model.trim(),
                plateNumber: newVehicle.plateNumber.trim(),
                year: newVehicle.year ? Number(newVehicle.year) : undefined,
                color: newVehicle.color.trim() || undefined,
            });

            toast.success('Vehicle added successfully!');
            setShowAddModal(false);
            setNewVehicle({ make: '', model: '', plateNumber: '', year: '', color: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add vehicle');
        }
    };

    return (
        <div className="space-y-4">
            {/* Label + Add button */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Vehicle
                </label>
                {onAddVehicle && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        disabled={isLoading}
                    >
                        + Add New Vehicle
                    </Button>
                )}
            </div>

            {/* Select */}
            <Select
                options={options}
                value={selectedVehicleId || ''}
                onChange={(e) => onSelect(e.target.value)}
                placeholder="Choose a vehicle..."
                disabled={isLoading || vehicles.length === 0}
                error={!vehicles.length && !isLoading ? 'No vehicles found. Add one first.' : undefined}
            />

            {/* Loading / Error */}
            {isLoading && (
                <div className="text-center py-4 text-slate-500">Loading vehicles...</div>
            )}
            {error && !isLoading && (
                <div className="text-red-600 dark:text-red-400 text-sm text-center py-2">{error}</div>
            )}

            {/* Selected vehicle preview */}
            {selectedVehicle && !isLoading && (
                <Card className="mt-4 p-4">
                    <div className="flex flex-col gap-1">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                            {selectedVehicle.make} {selectedVehicle.model}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Plate: <span className="font-mono">{selectedVehicle.plateNumber}</span>
                        </p>
                        {selectedVehicle.year && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Year: {selectedVehicle.year}
                            </p>
                        )}
                        {selectedVehicle.color && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Color: {selectedVehicle.color}
                            </p>
                        )}
                    </div>
                </Card>
            )}

            {/* Add Vehicle Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Vehicle"
            >
                <div className="space-y-5">
                    <Input
                        label="Make"
                        placeholder="Toyota"
                        value={newVehicle.make}
                        onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    />
                    <Input
                        label="Model"
                        placeholder="Corolla"
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    />
                    <Input
                        label="Plate Number"
                        placeholder="T-123-AB"
                        value={newVehicle.plateNumber}
                        onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                    />
                    <Input
                        label="Year (optional)"
                        type="number"
                        placeholder="2020"
                        value={newVehicle.year}
                        onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    />
                    <Input
                        label="Color (optional)"
                        placeholder="Silver"
                        value={newVehicle.color}
                        onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleAddVehicle}
                            disabled={
                                !newVehicle.make ||
                                !newVehicle.model ||
                                !newVehicle.plateNumber
                            }
                        >
                            Save Vehicle
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}