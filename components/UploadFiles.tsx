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

    return <View style={{
        paddingLeft: Dimensions.get('window').width < 768 ? 0 : 10,
        paddingTop: 3.5,
        paddingBottom: Dimensions.get('window').width < 768 ? 5 : 0
    }}>
        {
            uploading ? <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                Importing...
            </Text> :
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: Dimensions.get('window').width < 768 ? 'center' : 'flex-end' }}>
                    <input
                        type="file"
                        name="import"
                        title="Import"
                        onChange={onChange}
                        style={{
                            backgroundColor: '#fff',
                            fontFamily: 'overpass',
                            fontSize: 12,
                            color: '#a6a2a2',
                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 20,
                            marginRight: 10,
                            width: 170
                        }}
                        accept=".pdf,.docx,.pptx,.xlsx,.csv,.mp3,.mp4"
                    />
                    <Text style={{
                        height: 20,
                        backgroundColor: 'white',
                        fontSize: 9,
                        color: '#a6a2a2',
                        marginTop: 1,
                        textAlign: 'left',
                        lineHeight: 20
                    }}>
                        pdf docx pptx xlsx csv mp3 mp4 zip
                        </Text>
                </div>
        }
    </View>
}

export default FileUpload