import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation/Navigator';
import * as SplashScreen from 'expo-splash-screen';
import "react-datetime/css/react-datetime.css"
import 'rsuite/dist/styles/rsuite-default.css'
import { LanguageProvider } from "./helpers/LanguageContext";
import { MenuProvider } from 'react-native-popup-menu';
// import {DragDropContextProvider} from 'react-dnd';
// import HTML5Backend from 'react-dnd-html5-backend';

export default function App() {

  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const longerSplashScreen = useCallback(async () => {
    await SplashScreen.preventAutoHideAsync();
    const a: any = new Date()
    let b: any = new Date()
    while ((b - a) < 1000) {
      b = new Date()
    }
    await SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    longerSplashScreen()
  }, [])

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider style={styles.font}>
        <MenuProvider>
          {/* <DragDropContextProvider backend={HTML5Backend}> */}
          <LanguageProvider>
            <Navigation colorScheme={colorScheme} />
          </LanguageProvider>
          {/* </DragDropContextProvider> */}
        </MenuProvider>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}

const styles: any = StyleSheet.create({
  font: {
    maxHeight: '100%',
  }
});
