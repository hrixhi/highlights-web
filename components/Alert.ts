import { Alert, Platform } from 'react-native'
const alertPolyfill = (title: any, description: any, options: any, extra: any) => {
    console.log('Platform', Platform)
    console.log('options', options)
    const result = window.confirm([title, description].filter(Boolean).join('\n'))
    console.log('result', result)
    if (!options) {
        return;
    }
    if (result) {
        const confirmOption = options.find(({ style }: any) => style !== 'cancel')
        confirmOption && confirmOption.onPress && confirmOption.onPress()
    } else {
        const cancelOption = options.find(({ style }: any) => style === 'cancel')
        cancelOption && cancelOption.onPress && cancelOption.onPress()
    }
}

const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert
export default alert