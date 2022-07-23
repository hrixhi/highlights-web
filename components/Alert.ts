// import { Alert, Platform } from 'react-native';
// const alertPolyfill = (title: any, description: any, options: any, extra: any) => {
//     if (!options) {
//         window.alert([title, description].filter(Boolean).join('\n'));
//         return;
//     }
//     const result = window.confirm([title, description].filter(Boolean).join('\n'));

//     if (result) {
//         const confirmOption = options.find(({ style }: any) => style !== 'cancel');
//         confirmOption && confirmOption.onPress && confirmOption.onPress();
//     } else {
//         const cancelOption = options.find(({ style }: any) => style === 'cancel');
//         cancelOption && cancelOption.onPress && cancelOption.onPress();
//     }
// };

var vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

const Alert = (title: any, description?: any, options?: any) => {
    if (!description && !options) {
        vex.dialog.alert({
            className: 'vex-theme-os',
            message: title,
        });
        return;
    }

    let buttons: any[] = [];

    if (options) {
        options.map((option: any) => {
            if (option.style && option.style === 'cancel') {
                buttons.push(Object.assign({}, vex.dialog.buttons.NO, { text: option.text }));
            } else {
                buttons.push(Object.assign({}, vex.dialog.buttons.YES, { text: option.text }));
            }
        });
    }

    vex.dialog.alert({
        className: 'vex-theme-os',
        unsafeMessage:
            !description || description === ''
                ? `<p>${title}</p>`
                : `<p>${title}</p><div class="description"><p >${description}</p></div>`,
        buttons,
        callback: function (value: any) {
            if (value) {
                const confirmOption = options.find(({ style }: any) => style !== 'cancel');
                confirmOption && confirmOption.onPress && confirmOption.onPress();
                console.log('Value', value);
            } else {
                console.log('Value', value);
                const cancelOption = options.find(({ style }: any) => style === 'cancel');
                cancelOption && cancelOption.onPress && cancelOption.onPress();
            }
        },
    });
};
// const alert = Platform.OS === 'web' ? alertPolyfill : Alert.alert;

export default Alert;
