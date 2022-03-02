import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, Alert } from 'react-native';

export default function DesktopSSO({ navigation, route }: StackScreenProps<any, 'desktopSSORedirect'>) {
    React.useEffect(() => {
        (async () => {
            if (Platform.OS === 'web') {
                // check URL over here

                const code = route?.params?.code;
                // const userId = route?.params?.state;

                if (code) {
                    window.open('cues-app://ssoRedirect?code=' + code);
                }
            }
        })();
    }, []);

    return null;
}
