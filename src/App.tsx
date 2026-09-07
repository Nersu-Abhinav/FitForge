import React, { useState, useEffect } from 'react';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomTabBar, TabKey } from '@/components/navigation/BottomTabBar';
import { QuickActionSheet } from '@/components/navigation/QuickActionSheet';
import { RestTimerFloating } from '@/components/workout/RestTimerFloating';
import { PRCelebrationModal } from '@/components/workout/PRCelebrationModal';
import { ActiveWorkoutModal } from '@/components/workout/ActiveWorkoutModal';
import { AIAdvisorScreen } from '@/screens/ai/AIAdvisorScreen';
import { PersistenceNotificationToast } from '@/components/common/PersistenceNotificationToast';
import { AppBootSplash } from '@/components/common/AppBootSplash';

import { HomeScreen } from '@/screens/home/HomeScreen';
import { WorkoutScreen } from '@/screens/workout/WorkoutScreen';
import { HealthScreen } from '@/screens/health/HealthScreen';
import { NutritionScreen } from '@/screens/nutrition/NutritionScreen';
import { ProgressScreen } from '@/screens/progress/ProgressScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { api } from '@/services/api';

import { initMobileNativeIntegrations } from '@/utils/mobileNative';

export function App() {
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [isDataSynced, setIsDataSynced] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [isActiveWorkoutOpen, setIsActiveWorkoutOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);

  const { setUserFromDB } = useAuthStore();
  const { setWorkoutsFromDB, setCustomExercisesFromDB, setWeeklySplitFromDB, startWorkout } = useWorkoutStore();
  const { setMealsFromDB, setCustomFoodsFromDB, setFavoriteFoodsFromDB } = useNutritionStore();
  const { setHydrationFromDB } = useHydrationStore();
  const { setBodyDataFromDB } = useBodyStore();

  // Mobile Native Back Button & System Navigation Interceptor
  useEffect(() => {
    const cleanup = initMobileNativeIntegrations({
      closeModals: () => {
        if (isAIAdvisorOpen) {
          setIsAIAdvisorOpen(false);
          setAiInitialQuery(undefined);
          return true;
        }
        if (isActiveWorkoutOpen) {
          setIsActiveWorkoutOpen(false);
          return true;
        }
        if (isQuickActionOpen) {
          setIsQuickActionOpen(false);
          return true;
        }
        // Check for any modal close buttons currently present on screen
        const modalCloseButtons = document.querySelectorAll<HTMLElement>('[data-back-dismissible="true"], .modal-close-btn, button[aria-label="Close"]');
        if (modalCloseButtons && modalCloseButtons.length > 0) {
          modalCloseButtons[modalCloseButtons.length - 1].click();
          return true;
        }
        return false;
      },
      navigateToHome: () => {
        if (currentTab !== 'home') {
          setCurrentTab('home');
          return true;
        }
        return false;
      }
    });

    return () => {
      cleanup();
    };
  }, [isAIAdvisorOpen, isActiveWorkoutOpen, isQuickActionOpen, currentTab]);

  // Pure Offline-First Database Synchronization & SyncEngine Boot
  useEffect(() => {
    let isMounted = true;

    const applyStateToZustand = (data: any) => {
      if (!data || !isMounted) return;
      if (data.user) setUserFromDB(data.user);
      if (data.workouts) setWorkoutsFromDB(data.workouts);
      if (data.customExercises && Array.isArray(data.customExercises)) {
        setCustomExercisesFromDB(data.customExercises);
      }
      if (data.customFoods && Array.isArray(data.customFoods)) {
        setCustomFoodsFromDB(data.customFoods);
      }
      if (data.favoriteFoodIds && Array.isArray(data.favoriteFoodIds)) {
        setFavoriteFoodsFromDB(data.favoriteFoodIds);
      }
      if (data.weeklySplit && Array.isArray(data.weeklySplit) && data.weeklySplit.length === 7) {
        setWeeklySplitFromDB(data.weeklySplit);
      }
      if (data.meals) setMealsFromDB(data.meals);
      if (data.hydration) setHydrationFromDB(data.hydration);
      setBodyDataFromDB({
        measurements: data.measurements || [],
        sleepLogs: data.sleepLogs || [],
        recoveryLogs: data.recoveryLogs || []
      });
    };

    async function bootstrap() {
      // 1. Step 1: Instant load from Local IndexedDB into Zustand
      const localData = await api.loadLocalState();
      if (localData && isMounted) {
        applyStateToZustand(localData);
      }

      // 2. Initialize syncEngine with listener for background push-then-pull
      api.init(async () => {
        const synced = await api.syncAll();
        if (synced && isMounted) {
          applyStateToZustand(synced);
        }
      });

      // 3. Step 2 to 7: Push local pending queue, pull latest TiDB, reconcile & update
      const fullSyncedData = await api.syncAll();
      if (fullSyncedData && isMounted) {
        applyStateToZustand(fullSyncedData);
        setIsDataSynced(true);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartSuggestedWorkout = (name: string, exerciseIds?: string[]) => {
    startWorkout(name, exerciseIds);
    setIsActiveWorkoutOpen(true);
  };

  const handleSelectTab = (tab: TabKey) => {
    setIsQuickActionOpen(false);
    setIsAIAdvisorOpen(false);
    setCurrentTab(tab);
  };

  return (
    <div className="h-screen w-full bg-[#06090F] text-slate-100 flex flex-row overflow-hidden">
      {/* 0. Cinematic Opening Splash Boot Screen */}
      {isBooting && (
        <AppBootSplash 
          onComplete={() => setIsBooting(false)} 
          isDataReady={isDataSynced} 
        />
      )}

      {/* 1. Desktop Left Navigation Sidebar */}
      <DesktopSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <div 
        id="app-main-viewport"
        className="app-scroll-container flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden relative"
      >
        {/* Desktop Top Header Bar */}
        <div className="hidden md:block">
          <DesktopHeader
            onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
          />
        </div>

        {/* Mobile Top Header Bar */}
        <div className="block md:hidden">
          <TopHeader
            onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
            onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
            onOpenProfile={() => setCurrentTab('profile')}
          />
        </div>

        {/* Main Content Area: Responsive Multi-Column Layout with Mobile Safe Padding */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-8">
          {currentTab === 'home' && (
            <HomeScreen
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
              onOpenQuickAction={() => setIsQuickActionOpen(true)}
              onOpenAIAdvisor={(query) => {
                setAiInitialQuery(query);
                setIsAIAdvisorOpen(true);
              }}
            />
          )}

          {currentTab === 'workout' && (
            <WorkoutScreen
              onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
            />
          )}

          {currentTab === 'health' && (
            <HealthScreen />
          )}

          {currentTab === 'nutrition' && (
            <NutritionScreen />
          )}

          {currentTab === 'progress' && (
            <ProgressScreen />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="block md:hidden">
          <BottomTabBar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
          />
        </div>
      </div>

      {/* Overlays & Modals */}
      <RestTimerFloating />
      <PRCelebrationModal />
      <ActiveWorkoutModal
        isOpen={isActiveWorkoutOpen}
        onClose={() => setIsActiveWorkoutOpen(false)}
      />
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenActiveWorkout={() => setIsActiveWorkoutOpen(true)}
      />
      <AIAdvisorScreen
        isOpen={isAIAdvisorOpen}
        onClose={() => {
          setIsAIAdvisorOpen(false);
          setAiInitialQuery(undefined);
        }}
        initialQuery={aiInitialQuery}
        onStartSuggestedWorkout={handleStartSuggestedWorkout}
      />
      <PersistenceNotificationToast />
    </div>
  );
}

export default App;
