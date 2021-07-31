import { Alert, Platform } from 'react-native'
const alertPolyfill = (title: any, description: any, options: any, extra: any) => {
    const result = window.alert([title, description].filter(Boolean).join('\n'))
    if (!options) {
        return;
    }
    const confirmOption = options.find(({ style }: any) => style !== 'cancel')
    confirmOption && confirmOption.onPress && confirmOption.onPress()
    // if (result) {
    //     const confirmOption = options.find(({ style }: any) => style !== 'cancel')
    //     confirmOption && confirmOption.onPress && confirmOption.onPress()
    // } else {
    //     const cancelOption = options.find(({ style }: any) => style === 'cancel')
    //     cancelOption && cancelOption.onPress && cancelOption.onPress() 
    // }
}

const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert
export default alert