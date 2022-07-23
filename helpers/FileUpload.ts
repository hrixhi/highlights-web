import * as DocumentPicker from 'expo-document-picker';
const mime = require('mime-types');
import axios from 'axios';
import Alert from '../components/Alert';

export const handleFile = async (audioVideoOnly: boolean, userId: string, imagesOnly?: boolean) => {
    // e.preventDefault();
    const res: any = await DocumentPicker.getDocumentAsync();

    if (res.type === 'cancel' || res.type !== 'success') {
        return { type: '', url: '' };
    }

    const { file } = res;

    if (file.size > 26214400) {
        Alert('File size must be less than 25 mb');
        return;
    }
    if (file === null) {
        return { type: '', url: '' };
    }

    let type = mime.extension(file.type);

    if (file.type === 'video/avi') {
        type = 'avi';
    } else if (file.type === 'video/quicktime') {
        type = 'mov';
    }

    if (type === 'wma' || type === 'avi') {
        Alert('This video format is not supported. Upload mp4.');
        return { type: '', url: '' };
    }

    if (type === 'mpga') {
        type = 'mp3';
    }

    if (!imagesOnly && (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif')) {
        Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
        return { type: '', url: '' };
    }

    if (imagesOnly && type !== 'png' && type !== 'jpeg' && type !== 'jpg' && type !== 'gif') {
        Alert('Upload Images only.');
        return { type: '', url: '' };
    }

    if (
        audioVideoOnly &&
        !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
    ) {
        Alert('Error! This file format is not supported. Upload mp4.');
        return { type: '', url: '' };
    }

    if (type === 'svg') {
        Alert('This file type is not supported.');
        return { type: '', url: '' };
    }

    const response = await fileUpload(file, type, userId);

    const { data } = response;
    if (data.status === 'success') {
        return {
            url: data.url,
            type,
        };
    } else {
        return { type: '', url: '' };
    }
};

export const handleFileUploadEditor = async (audioVideoOnly: boolean, file: any, userId: string) => {
    // e.preventDefault();

    if (file === null) {
        return { type: '', url: '', name: '' };
    }

    if (file.size > 26214400) {
        Alert('File size must be less than 25 mb.');
        return { type: '', url: '', name: '' };
    }

    let type = mime.extension(file.type);

    if (type === 'txt') {
        Alert('txt files are not supported. Convert to pdf and upload.');
        return { type: '', url: '', name: '' };
    }

    if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
        Alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.');
        return { type: '', url: '', name: '' };
    }

    if (
        audioVideoOnly &&
        !(type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav')
    ) {
        Alert('Error! This file format is not supported. Upload mp4.');
        return { type: '', url: '', name: '' };
    }

    if (file.type === 'video/avi') {
        type = 'avi';
    } else if (file.type === 'video/quicktime') {
        type = 'mov';
    }

    if (type === 'wma' || type === 'avi') {
        Alert('This video format is not supported. Upload mp4.');
        return { type: '', url: '', name: '' };
    }

    if (type === 'mpga') {
        type = 'mp3';
    }

    if (type === 'svg') {
        Alert('This file type is not supported.');
        return { type: '', url: '', name: '' };
    }

    Alert('Upload in progress! Large files may take longer to process.');

    const response = await fileUpload(file, type, userId);

    const { data } = response;
    if (data.status === 'success') {
        return {
            url: data.url,
            type,
            name: file.name,
        };
    } else {
        return { type: '', url: '', name: file.name };
    }
};

export const fileUpload = async (file: any, type: any, userId: string) => {
    // LIVE
    const url = 'https://api.learnwithcues.com/api/upload';
    // DEV
    // const url = 'http://localhost:8081/api/upload';
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('typeOfUpload', type);
    formData.append('userId', userId);
    const config = {
        headers: {
            'content-type': 'multipart/form-data',
        },
    };
    const res = await axios.post(url, formData, config);

    return res;
};

export const fileUploadInbox = async (file: any, type: any, userId: string) => {
    console.log('Type', type);
    // LIVE
    const url = 'https://api.learnwithcues.com/api/uploadInbox';

    // DEV
    // const url = 'http://localhost:8081/api/uploadInbox';
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('typeOfUpload', type);
    formData.append('userId', userId);
    const config = {
        headers: {
            'content-type': 'multipart/form-data',
        },
    };
    const res = await axios.post(url, formData, config);

    return res;
};
