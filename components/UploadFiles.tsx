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
        if(e.target.files.length > 0){
             let fileListData:any[] = new Array();
             let fileTypeData:any[] = new Array();
            for(var fileItem of e.target.files){
                fileListData.push(fileItem);
                fileTypeData.push(mime.extension(fileItem.type))
            }
            multiFileUpload(fileListData).then((response) => {
                const { data } = response;
                if (data.status === "success") {
                    console.log(data)
                     props.onUpload(data.url,fileTypeData);
                    setUploading(false);
                } else {
                    setUploading(false);
                }
            });
        }
        else {
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
            if ((type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') && props.action !== 'message_send') {
                alert('Error! Images should be directly added to the text editor using the gallery icon in the toolbar.')
                setUploading(false)
                return
            }
            fileUpload(file, type).then(response => {
                const { data } = response;
                if (data.status === "success") {
                    props.onUploadOther(data.url, type);
                    setUploading(false)
                } else {
                    setUploading(false)
                }
            });
        }
    }, [])

    const fileUpload = useCallback((file, type) => {
        const url = "http://localhost:8081/api/upload";
        
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
    const multiFileUpload = useCallback(async(files) => {
        const url = "http://localhost:8081/api/multiupload";
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            await formData.append('attachment['+i+']', files[i]);
        }
       // formData.append('attachment', files);
        const config = {
            headers: {
                "content-type": "multipart/form-data",
            },
        };
        return axios.post(url, formData, config);
    }, []);

    return <View style={{
        paddingTop: 3.5,
        paddingBottom: Dimensions.get('window').width < 768 ? 5 : 0
    }}>
        {
            uploading ? <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                Importing...
            </Text> :
                <div style={{
                    display: 'flex', flexDirection: 'row'
                }}>
                    <Ionicons name="arrow-back" color="#a2a2ac" size={17} style={{ marginRight: 10 }} onPress={() => props.back()} />
                    <input
                        type="file"
                        name="import"
                        title="Import"
                        onChange={onChange}
                        style={{
                            backgroundColor: '#fff',
                            fontFamily: 'overpass',
                            fontSize: 12,
                            color: '#a2a2ac',
                            marginRight: 10,    
                            width: 170
                        }}
                        multiple
                    />
                </div>
        }
    </View >
}

export default FileUpload