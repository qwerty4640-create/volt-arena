import { useEffect, useRef } from 'react';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';

export const DataRedundancyManager = () => {
    const { history, recoveryHistory } = useWorkout();
    const { profile } = useSettings();
    const lastBackupRef = useRef<string>('');

    useEffect(() => {
        if (!profile || !profile.uid) return;

        const backupData = async () => {
            const dataToBackup = {
                profile,
                history,
                recoveryHistory,
                timestamp: Date.now()
            };

            const dataString = JSON.stringify(dataToBackup);
            if (dataString === lastBackupRef.current) return; // Only backup if state changed

            try {
                await fetch('/api/backup-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        uid: profile.uid, 
                        filename: 'full_user_state.json', 
                        data: dataToBackup 
                    })
                });
                lastBackupRef.current = dataString;
                console.log('Comprehensive backup successful');
            } catch (e) {
                console.error('Comprehensive backup failed', e);
            }
        };

        // Backup when profile, history, or recoveryHistory changes, with a delay
        const timer = setTimeout(backupData, 30000); // 30s debounce
        return () => clearTimeout(timer);
    }, [history, recoveryHistory, profile]);

    return null;
};
