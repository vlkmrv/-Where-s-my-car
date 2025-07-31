import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  MapPin, 
  Clock, 
  Smartphone, 
  Info, 
  Trash2,
  ChevronRight,
  Volume2,
  Vibrate,
  Building
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  autoSaveLocation: boolean;
  showFloorOption: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  sound: true,
  vibration: true,
  autoSaveLocation: false,
  showFloorOption: true,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('appSettings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const updateSetting = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const clearAllData = () => {
    Alert.alert(
      'Очистить все данные',
      'Это действие удалит всю историю парковок, активные таймеры и настройки. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'parkingHistory',
                'currentParkingLocation',
                'activeTimer',
                'appSettings'
              ]);
              setSettings(DEFAULT_SETTINGS);
              Alert.alert('Готово', 'Все данные очищены');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось очистить данные');
            }
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'О приложении',
      'Где моя машина? v1.0\n\nПриложение для поиска припаркованного автомобиля с функциями таймера и истории парковок.\n\nРазработано by VLKMRV.',
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    showSwitch = true,
    onPress 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showSwitch?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && showSwitch}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
          thumbColor={value ? '#2563EB' : '#F3F4F6'}
        />
      ) : (
        <ChevronRight size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Настройки</Text>
        <Text style={styles.headerSubtitle}>Персонализируйте приложение</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Bell size={20} color="#2563EB" />}
              title="Push-уведомления"
              subtitle="Получать уведомления о таймере"
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
            />
            <SettingItem
              icon={<Volume2 size={20} color="#10B981" />}
              title="Звуковые уведомления"
              subtitle="Воспроизводить звук при уведомлениях"
              value={settings.sound}
              onValueChange={(value) => updateSetting('sound', value)}
            />
            <SettingItem
              icon={<Vibrate size={20} color="#F59E0B" />}
              title="Вибрация"
              subtitle="Вибрировать при уведомлениях"
              value={settings.vibration}
              onValueChange={(value) => updateSetting('vibration', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Парковка</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<MapPin size={20} color="#8B5CF6" />}
              title="Автосохранение"
              subtitle="Автоматически сохранять местоположение"
              value={settings.autoSaveLocation}
              onValueChange={(value) => updateSetting('autoSaveLocation', value)}
            />
            <SettingItem
              icon={<Building size={20} color="#EF4444" />}
              title="Выбор этажа"
              subtitle="Показывать опцию выбора этажа"
              value={settings.showFloorOption}
              onValueChange={(value) => updateSetting('showFloorOption', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Данные</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Trash2 size={20} color="#EF4444" />}
              title="Очистить все данные"
              subtitle="Удалить историю, таймеры и настройки"
              showSwitch={false}
              onPress={clearAllData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Info size={20} color="#6B7280" />}
              title="О приложении"
              subtitle="Версия и информация о разработчике"
              showSwitch={false}
              onPress={showAbout}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Где моя машина? v1.0</Text>
          <Text style={styles.footerSubtext}>
            Приложение для поиска припаркованного автомобиля
          </Text>
        </View>
      </ScrollView>
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
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});