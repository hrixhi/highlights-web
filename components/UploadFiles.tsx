// REACT
import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
const mime = require('mime-types');

// COMPONENTS
import { Text, View } from './Themed';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';

const FileUpload: React.FC<any> = (props: any) => {
    const [uploading, setUploading] = useState(false);
    const handleFile = useCallback(async () => {
        // e.preventDefault();
        const res: any = await DocumentPicker.getDocumentAsync();

        if (res.type === 'cancel' || res.type !== 'success') {
            return;
        }

        const { file } = res;

        setUploading(true);
        if (file.size > 26214400) {
            alert('File size must be less than 25 mb');
            setUploading(false);
            return;
        }
        if (file === null) {
            setUploading(false);
            return;
        }

        let type = mime.extension(file.type);

        if (file.type === 'video/avi') {
            type = 'avi';
        } else if (file.type === 'video/quicktime') {
            type = 'mov';
        }

        if (type === 'wma' || type === 'avi') {
            alert('This video format is not supported. Upload mp4.');
            setUploading(false);
            return;
        }

        if (type === 'svg') {
            alert('This file type is not supported.');
            setUploading(false);
            return;
        }

        if (type === 'mpga') {
            type = 'mp3';
        }

        if (!props.back) {
            // if (type !== 'png' && type !== 'jpeg') {
            //     alert('Error! Invalid image format.')
            //     setUploading(false)
            //     return
            // }
        } else if (
            (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') &&
            props.action !== 'message_send'
        ) {
            alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
            setUploading(false);
            return;
        }

        if (
            props.action === 'audio/video' &&
            !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
        ) {
            alert('Error! This file format is not supported. Upload mp4.');
            setUploading(false);
            return;
        }

        fileUpload(file, type).then(response => {
            const { data } = response;
            if (data.status === 'success') {
                props.onUpload(data.url, type);
                setUploading(false);
            } else {
                setUploading(false);
            }
        });
    }, []);

    const fileUpload = useCallback((file, type) => {
        // LIVE
        const url = 'https://api.learnwithcues.com/api/upload';
        // DEV
        // const url = "http://localhost:8081/api/upload";
        const formData = new FormData();
        formData.append('attachment', file);
        formData.append('typeOfUpload', type);
        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            }
        };
        return axios.post(url, formData, config);
    }, []);

    return (
        <View>
            {uploading ? (
                <View>
                    <ActivityIndicator color={'#a2a2ac'} size={'small'} />
                </View>
            ) : props.quiz ? (
                <Text
                    style={{
                        color: '#006AFF',
                        // lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: 12,
                        fontFamily: 'overpass'
                    }}
                    onPress={() => handleFile()}
                >
                    Media
                </Text>
            ) : (
                <Text
                    style={{
                        color: '#006AFF',
                        lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: props.quiz ? 12 : 12,
                        fontFamily: 'overpass',
                        textTransform: 'uppercase',
                        paddingLeft: 10
                    }}
                    onPress={() => handleFile()}
                >
                    {props.chat ? (
                        <Ionicons name="document-attach-outline" size={18} />
                    ) : (
                        PreferredLanguageText('import')
                    )}
                </Text>
            )}
        </View>
    );
};

export default FileUpload;
