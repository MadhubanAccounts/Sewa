
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Permission, PermissionDefinition } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { usePermissions } from '../../hooks/usePermissions';
import { SurfaceLoader } from '../common/SurfaceLoader';

interface PermissionSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
}

const normPerm = (p: any) => String(p || '').trim().toLowerCase().replace(/^perm_/, '');

const PermissionSimulator: React.FC<PermissionSimulatorProps> = ({ isOpen, onClose }) => {
    const { user, simulatePermissions, resetPermissions, isSimulating, simulatedPermissions } = useAuth();
    const { permissionDefinitions, loading } = usePermissions();

    const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(
        new Set(simulatedPermissions || user?.permissions || [])
    );

    // Sync selected permissions whenever dialog opens or simulated/user permissions change
    useEffect(() => {
        if (isOpen) {
            setSelectedPermissions(new Set(simulatedPermissions || user?.permissions || []));
        }
    }, [isOpen, simulatedPermissions, user?.permissions]);

    const groupedPermissions = useMemo(() => {
        return permissionDefinitions.reduce((acc, perm) => {
            const category = perm.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(perm);
            return acc;
        }, {} as Record<string, PermissionDefinition[]>);
    }, [permissionDefinitions]);

    const isPermSelected = (perm: PermissionDefinition) => {
        const cleanName = normPerm(perm.permissionName);
        const cleanId = normPerm(perm.permissionId);
        for (const item of selectedPermissions) {
            const cleanItem = normPerm(item);
            if (cleanItem === cleanName || cleanItem === cleanId) return true;
        }
        return false;
    };

    const handlePermissionChange = (perm: PermissionDefinition, checked: boolean) => {
        setSelectedPermissions(prev => {
            const newPerms = new Set(prev);
            const cleanName = normPerm(perm.permissionName);
            const cleanId = normPerm(perm.permissionId);

            // Remove existing variants
            for (const item of Array.from(newPerms)) {
                const cleanItem = normPerm(item);
                if (cleanItem === cleanName || cleanItem === cleanId) {
                    newPerms.delete(item);
                }
            }

            if (checked) {
                // Add both permissionName and permissionId to be completely robust
                newPerms.add(perm.permissionName);
                if (perm.permissionId && perm.permissionId !== perm.permissionName) {
                    newPerms.add(perm.permissionId);
                }
            }
            return newPerms;
        });
    };

    const handleApply = () => {
        simulatePermissions(Array.from(selectedPermissions));
        onClose();
    };

    const handleReset = () => {
        resetPermissions();
        onClose();
    };
    
    const handleSelectAll = () => {
        const allSet = new Set<string>();
        permissionDefinitions.forEach(p => {
            allSet.add(p.permissionName);
            if (p.permissionId) allSet.add(p.permissionId);
        });
        setSelectedPermissions(allSet);
    };

    const handleClearAll = () => {
        setSelectedPermissions(new Set());
    };

    const renderFooter = () => (
        <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {isSimulating && (
                <Button variant="danger" onClick={handleReset} className="w-full sm:w-auto">
                    Exit Current Simulation
                </Button>
            )}
            <Button onClick={handleApply} className="w-full sm:w-auto">
                Apply Simulation
            </Button>
        </div>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Permission Simulator"
            footer={renderFooter()}
        >
            <div className="space-y-4 min-h-[300px] relative">
                {loading ? (
                    <SurfaceLoader label="Loading permissions..." />
                ) : (
                    <>
                        <p className="text-sm text-[var(--foreground-muted)]">
                            Select the permissions you want to simulate for your current session. This will change the UI to show you exactly what a user with these permissions would see.
                        </p>

                        <div className="flex items-center space-x-2">
                            <Button variant="secondary" size="sm" onClick={handleSelectAll} disabled={loading}>Select All</Button>
                            <Button variant="secondary" size="sm" onClick={handleClearAll} disabled={loading}>Clear All</Button>
                        </div>

                        <div className="space-y-4 p-4 border-2 border-[var(--border)] rounded-lg bg-[var(--card-inset-background)]">
                            {Object.keys(groupedPermissions).sort().map(category => (
                                <div key={category}>
                                    <p className="font-bold text-[var(--foreground)]">{category}</p>
                                    <div className="mt-2 space-y-2 pl-2">
                                        {groupedPermissions[category].map(permission => (
                                            <div key={permission.permissionId}>
                                                <Checkbox
                                                    id={`sim-${permission.permissionName}`}
                                                    checked={isPermSelected(permission)}
                                                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                                    label={(
                                                        <span className="text-sm text-[var(--foreground)]">
                                                            {permission.description}
                                                            <span className="block text-xs text-[var(--foreground-muted)] font-mono">({permission.permissionName})</span>
                                                        </span>
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PermissionSimulator;
