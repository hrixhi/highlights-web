import * as Linking from 'expo-linking';

export default {
    prefixes: [Linking.makeUrl('/')],
    config: {
        screens: {
            Root: {
                screens: {
                    TabOne: {
                        screens: {
                            TabOneScreen: 'one'
                        }
                    },
                    TabTwo: {
                        screens: {
                            TabTwoScreen: 'two'
                        }
                    }
                }
            },
            zoom_auth: 'zoom_auth',
            pdfviewer: 'pdfviewer',
            login: 'login',
            desktopSSORedirect: 'desktopSSORedirect',
            NotFound: '*'
        }
    }
};
