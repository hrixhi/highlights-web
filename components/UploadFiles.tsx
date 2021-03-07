import React, { useCallback, useState } from 'react'
import { Text, View } from './Themed'
import axios from 'axios'
import { Ionicons } from '@expo/vector-icons'

const mime = require('mime-types')

const FileUpload: React.FC<any> = (props: any) => {

    const [uploading, setUploading] = useState(false)
    const onChange = useCallback((e) => {
        setUploading(true)
        e.preventDefault();
        const file = e.target.files[0]
        if (file === null) {
            setUploading(false)
            return;
        }
        let type = mime.extension(file.type);
        if (type === 'mpga') {
            type = 'mp3'
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
        const url = "http://trackcovid-env.eba-9srgt228.us-east-1.elasticbeanstalk.com:8081/api/upload";
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

    return <View style={{ paddingTop: 10 }}>
        {
            uploading ? <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                Importing...
            </Text> :
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        <Ionicons
                            name='cloud-upload-outline' size={12} color={'#a6a2a2'} />
                    </Text>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        PDF
                        </Text>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        DOCX
                    </Text>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        PPTX
                    </Text>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        XLSX/CSV
                    </Text>
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        marginRight: 20,
                        fontSize: 12,
                        color: '#a6a2a2',
                        marginTop: 1
                    }}>
                        MP3/MP4
                    </Text>
                    <input
                        type="file"
                        onChange={onChange}
                        style={{
                            backgroundColor: '#fff',
                            fontFamily: 'overpass',
                            fontSize: 12,
                            color: '#a6a2a2'
                        }}
                        accept=".pdf,.docx,.pptx,.xlsx,.csv,.mp3,.mp4"
                    />
                </div>
        }
    </View>
}

export default FileUpload