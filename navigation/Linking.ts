import * as Linking from 'expo-linking';

export default {
    prefixes: [Linking.makeUrl('/')],
    config: {
        screens: {
            Root: '',
            zoom_auth: 'zoom_auth',
            google_auth: 'google_auth',
            pdfviewer: 'pdfviewer',
            equationEditor: 'equationEditor',
            login: 'login',
            demo: 'demo',
            desktopSSORedirect: 'desktopSSORedirect',
            NotFound: '*',
        },
    },
};
