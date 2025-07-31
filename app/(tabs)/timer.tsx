import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Play, Pause, Square, Plus, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Timer {
  id: string;
  duration: number;
  startTime: number;
  isActive: boolean;
  title: string;
}

const PRESET_TIMES = [
  { label: '10 мин', minutes: 10 },
  { label: '30 мин', minutes: 30 },
  { label: '1 час', minutes: 60 },
  { label: '2 часа', minutes: 120 },
  { label: '3 часа', minutes: 180 },
  { label: '4 часа', minutes: 240 },
  { label: '8 часов', minutes: 480 },
  { label: '12 часов', minutes: 720 },
  { label: '24 часа', minutes: 1440 },
];

export default function TimerScreen() {
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    loadActiveTimer();
  }, []);

  useEffect(() => {
    let interval: number;
    
    if (activeTimer && activeTimer.isActive) {
      interval = setInterval(() => {
        const elapsed = Date.now() - activeTimer.startTime;
        const remaining = Math.max(0, (activeTimer.duration * 60 * 1000) - elapsed);
        
        setRemainingTime(remaining);
        
        if (remaining === 0) {
          handleTimerExpired();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const loadActiveTimer = async () => {
    try {
      const saved = await AsyncStorage.getItem('activeTimer');
      if (saved) {
        const timer = JSON.parse(saved);
        setActiveTimer(timer);
        
        if (timer.isActive) {
          const elapsed = Date.now() - timer.startTime;
          const remaining = Math.max(0, (timer.duration * 60 * 1000) - elapsed);
          setRemainingTime(remaining);
          
          if (remaining === 0) {
            handleTimerExpired();
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки таймера:', error);
    }
  };

  const saveTimer = async (timer: Timer) => {
    try {
      await AsyncStorage.setItem('activeTimer', JSON.stringify(timer));
    } catch (error) {
      console.error('Ошибка сохранения таймера:', error);
    }
  };

  const startTimer = (minutes: number) => {
    const timer: Timer = {
      id: Date.now().toString(),
      duration: minutes,
      startTime: Date.now(),
      isActive: true,
      title: `Парковка ${minutes < 60 ? minutes + ' мин' : Math.floor(minutes / 60) + ' ч'}`,
    };
    
    setActiveTimer(timer);
    setRemainingTime(minutes * 60 * 1000);
    saveTimer(timer);
    setShowPresets(false);
    
    Alert.alert('Таймер запущен', `Уведомление придет через ${timer.title.toLowerCase()}`);
  };

  const pauseTimer = () => {
    if (!activeTimer) return;
    
    const updatedTimer = { ...activeTimer, isActive: false };
    setActiveTimer(updatedTimer);
    saveTimer(updatedTimer);
  };

  const resumeTimer = () => {
    if (!activeTimer) return;
    
    const updatedTimer = {
      ...activeTimer,
      isActive: true,
      startTime: Date.now() - ((activeTimer.duration * 60 * 1000) - remainingTime),
    };
    setActiveTimer(updatedTimer);
    saveTimer(updatedTimer);
  };

  const stopTimer = () => {
    Alert.alert(
      'Остановить таймер',
      'Вы уверены, что хотите остановить таймер?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Остановить',
          style: 'destructive',
          onPress: () => {
            setActiveTimer(null);
            setRemainingTime(0);
            AsyncStorage.removeItem('activeTimer');
          },
        },
      ]
    );
  };

  const handleTimerExpired = () => {
    setActiveTimer(null);
    setRemainingTime(0);
    AsyncStorage.removeItem('activeTimer');
    
    Alert.alert(
      '⏰ Время истекло!',
      'Время парковки закончилось. Не забудьте переместить автомобиль.',
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!activeTimer) return 0;
    const totalTime = activeTimer.duration * 60 * 1000;
    return ((totalTime - remainingTime) / totalTime) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Таймер парковки</Text>
        <Text style={styles.headerSubtitle}>Не забудьте про платную парковку</Text>
      </View>

      <ScrollView style={styles.content}>
        {activeTimer ? (
          <View style={styles.timerContainer}>
            <View style={styles.timerDisplay}>
              <View style={[styles.progressRing, { transform: [{ rotate: '-90deg' }] }]}>
                <View style={styles.progressBackground} />
                <View 
                  style={[
                    styles.progressFill,

                  ]} 
                />
              </View>
              <View style={styles.timerContent}>
                <Clock size={32} color="#2563EB" />
                <Text style={styles.timerTime}>{formatTime(remainingTime)}</Text>
                <Text style={styles.timerTitle}>{activeTimer.title}</Text>
              </View>
            </View>

            <View style={styles.timerControls}>
              {activeTimer.isActive ? (
                <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
                  <Pause size={24} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Пауза</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.playButton} onPress={resumeTimer}>
                  <Play size={24} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Продолжить</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
                <Square size={24} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Остановить</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timerInfo}>
              <View style={styles.infoItem}>
                <Bell size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  Уведомление придет в {new Date(activeTimer.startTime + activeTimer.duration * 60 * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noTimerContainer}>
            <Clock size={64} color="#D1D5DB" />
            <Text style={styles.noTimerTitle}>Нет активного таймера</Text>
            <Text style={styles.noTimerSubtitle}>
              Запустите таймер, чтобы не забыть про платную парковку
            </Text>
            
            <TouchableOpacity 
              style={styles.startTimerButton} 
              onPress={() => setShowPresets(true)}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.startTimerButtonText}>Запустить таймер</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Быстрый запуск</Text>
          <View style={styles.presetGrid}>
            {PRESET_TIMES.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => startTimer(preset.minutes)}
                disabled={!!activeTimer}
              >
                <Text style={[
                  styles.presetButtonText,
                  activeTimer && styles.presetButtonTextDisabled
                ]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPresets}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите время</Text>
            <TouchableOpacity onPress={() => setShowPresets(false)}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {PRESET_TIMES.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetModalButton}
                onPress={() => startTimer(preset.minutes)}
              >
                <Clock size={24} color="#2563EB" />
                <Text style={styles.presetModalButtonText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerDisplay: {
    position: 'relative',
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  progressBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#F3F4F6',
  },
  progressFill: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#2563EB',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  timerTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timerInfo: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  noTimerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noTimerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  noTimerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  startTimerButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startTimerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  presetButtonTextDisabled: {
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  presetModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  presetModalButtonText: {
    fontSize: 16,
    color: '#111827',
  },
});