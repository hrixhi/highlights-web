import React, { useCallback, useState } from 'react'
import { Text, View } from './Themed'
import axios from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { Dimensions } from 'react-native'

const mime = require('mime-types')

const FileUpload: React.FC<any> = (props: any) => {

    const [uploading, setUploading] = useState(false)
    const onChange = useCallback((e) => {
        setUploading(true)
        e.preventDefault();
        const file = e.target.files[0]
        if (file.size > 26214400) {
            alert('File size must be less than 25 mb')
            setUploading(false)
            return
        }
        if (file === null) {
            setUploading(false)
            return;
        }
        let type = mime.extension(file.type);
        if (type === 'mpga') {
            type = 'mp3'
        }

        if (!props.back) {
            if (type !== 'png' && type !== 'jpeg') {
                alert('Error! Invalid image format.')
                setUploading(false)
                return
            }
        } else if ((type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') && props.action !== 'message_send') {
            alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.')
            setUploading(false)
            return
        }

        if (props.action === "audio/video" && !(type === "mp4" ||
            type === "mp3" ||
            type === "mov" ||
            type === "mpeg" ||
            type === "mp2" ||
            type === "wav")) {
            alert('Error! Only audio/video files can be uploaded')
            setUploading(false)
            return
        }

        fileUpload(file, type).then(response => {
            const { data } = response;
            if (data.status === "success") {
                props.onUpload(data.url, type);
                setUploading(false)
            } else {
                setUploading(false)
            }
        });
    }, [])

    const fileUpload = useCallback((file, type) => {
        const url = "https://api.cuesapp.co/api/upload";
        const formData = new FormData();
        formData.append("attachment", file);
        formData.append("typeOfUpload", type);
        const config = {
            headers: {
                "content-type": "multipart/form-data"
            }
        };
        return axios.post(url, formData, config);
    }, [])

    return <View style={{
        paddingTop: 3.5,
        paddingBottom: Dimensions.get('window').width < 1024 ? 5 : 0
    }}>
        {
            uploading ? <Text style={{ fontSize: 11, color: '#1D1D20', textTransform: 'uppercase' }}>
                Importing...
            </Text> :
                <div style={{
                    display: 'flex', flexDirection: 'row'
                }}>
                    {
                        props.back ?
                            <Ionicons name="arrow-back" color="#818385" size={17} style={{ marginRight: 10 }} onPress={() => props.back()} />
                            : null
                    }
                    <input
                        type="file"
                        name="import"
                        title="Import"
                        onChange={onChange}
                        style={{
                            backgroundColor: '#fff',
                            fontFamily: 'overpass',
                            fontSize: 12,
                            color: '#818385',
                            marginRight: 10,
                            width: 170
                        }}
                    />
                </div>
        }
    </View >
}

export default FileUpload