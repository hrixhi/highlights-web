// REACT
import React, { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
const mime = require('mime-types');

// COMPONENTS
import { Text, View } from './Themed';
import Alert from './Alert';

const FileUpload: React.FC<any> = (props: any) => {
    const [uploading, setUploading] = useState(false);
    const handleFile = useCallback(async () => {
        // e.preventDefault();
        const res: any = await DocumentPicker.getDocumentAsync({
            type: props.profile ? 'image/*' : '*/*',
        });

        if (res.type === 'cancel' || res.type !== 'success') {
            return;
        }

        const { file } = res;

        setUploading(true);
        if (file.size > 26214400) {
            Alert('File size must be less than 25 mb');
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
            Alert('This video format is not supported. Upload mp4.');
            setUploading(false);
            return;
        }

        if (type === 'svg') {
            Alert('This file type is not supported.');
            setUploading(false);
            return;
        }

        if (type === 'mpga') {
            type = 'mp3';
        }

        if (!props.back) {
            // if (type !== 'png' && type !== 'jpeg') {
            //     Alert('Error! Invalid image format.')
            //     setUploading(false)
            //     return
            // }
        } else if (
            (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') &&
            props.action !== 'message_send'
        ) {
            Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
            setUploading(false);
            return;
        }

        if (
            props.action === 'audio/video' &&
            !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
        ) {
            Alert('Error! This file format is not supported. Upload mp4.');
            setUploading(false);
            return;
        }

        fileUpload(file, type).then((response) => {
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
                'content-type': 'multipart/form-data',
            },
        };
        return axios.post(url, formData, config);
    }, []);

    return (
        <View
            style={{
                position: props.profile ? 'absolute' : 'relative',
                backgroundColor: props.profile ? 'none' : '#fff',
            }}
        >
            {uploading ? (
                <View>
                    <ActivityIndicator color={'#a2a2ac'} size={'small'} />
                </View>
            ) : props.quiz ? (
                <Text
                    style={{
                        color: '#007AFF',
                        // lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: 13,
                        fontFamily: 'overpass',
                    }}
                    onPress={() => handleFile()}
                >
                    Media
                </Text>
            ) : (
                <Text
                    style={{
                        color: '#000',
                        backgroundColor: props.profile ? 'none' : '#fff',
                        lineHeight: props.chat ? 40 : 35,
                        textAlign: 'right',
                        fontSize: 15,
                        fontFamily: 'Inter',
                        textTransform: 'capitalize',
                        // paddingLeft: props.profile ? 0 : 10,
                    }}
                    onPress={() => handleFile()}
                >
                    {props.chat || props.profile ? (
                        <Ionicons
                            name={props.profile ? 'attach-outline' : 'document-attach-outline'}
                            size={props.profile ? 25 : 18}
                            color={props.profile ? 'white' : '#000'}
                        />
                    ) : (
                        'Import'
                    )}
                </Text>
            )}
        </View>
    );
};

export default FileUpload;
