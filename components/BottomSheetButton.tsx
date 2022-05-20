import React, { memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { TouchableOpacity as RNGHTouchableOpacity } from 'react-native-gesture-handler';

const BottomSheetButton = ({ children, ...otherProps }) => {
    var standalone = window.navigator.standalone,
        userAgent = window.navigator.userAgent.toLowerCase(),
        safari = /safari/.test(userAgent),
        ios = /iphone|ipod|ipad/.test(userAgent);

    if (ios) {
        if (!standalone && safari) {
            // Safari
        } else if (!standalone && !safari) {
            // iOS webview
        }
    } else {
        if (userAgent.includes('wv')) {
            // Android webview
        } else {
            // Chrome
        }
    }

    console.log('User agent', userAgent);

    if (userAgent.includes('wv')) {
        return <RNGHTouchableOpacity {...otherProps}>{children}</RNGHTouchableOpacity>;
    }

    return <TouchableOpacity {...otherProps}>{children}</TouchableOpacity>;
};

export default memo(BottomSheetButton);
