import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { ColorSchemeName, View } from 'react-native';

import NotFoundScreen from '../screens/NotFoundScreen';
import { RootStackParamList } from '../types';
import Home from '../screens/Home';
import LinkingConfiguration from './Linking';
import FinishZoomSetup from '../screens/FinishZoomSetup';
import PDFViewerCues from '../screens/PDFViewerCues';
import EquationEditorCues from '../screens/EquationEditorCues';
import DesktopSSO from '../screens/DesktopSSO';
import Auth from '../screens/Auth';
import Demo from '../screens/Demo';

// Main stack navigator
export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
    return (
        // <NavigationContainer linking={LinkingConfiguration} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Main app is in here */}
            <Stack.Screen name="Root" component={Home} options={{ title: 'Cues' }} />
            <Stack.Screen name="demo" component={Demo} options={{ title: 'Cues - Demo' }} />
            <Stack.Screen name="login" component={Auth} options={{ title: 'Sign In - Cues' }} />
            <Stack.Screen name="zoom_auth" component={FinishZoomSetup} options={{ title: 'Connecting Zoom...' }} />
            <Stack.Screen name="pdfviewer" component={PDFViewerCues} options={{ title: 'PDF Viewer CUES' }} />
            <Stack.Screen
                name="equationEditor"
                component={EquationEditorCues}
                options={{ title: 'Equation Editor CUES' }}
            />
            <Stack.Screen
                name="desktopSSORedirect"
                component={DesktopSSO}
                options={{ title: 'Cues - Single Sign On' }}
            />

            {/* In case navigation ends up at a wrong location */}
            <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
        </Stack.Navigator>
        // </NavigationContainer>
    );
}

// A root stack navigator is often used for displaying modals on top of all other content
const Stack = createStackNavigator<RootStackParamList>();
