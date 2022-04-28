// REACT
import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Switch, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { Popup } from '@mobiscroll/react';

import TextareaAutosize from 'react-textarea-autosize';
import { Select } from '@mobiscroll/react';

import FroalaEditor from 'react-froala-wysiwyg';
import Froalaeditor from 'froala-editor';

import { renderMathjax } from '../helpers/FormulaHelpers';
import Alert from '../components/Alert';

import { DISCUSS_POST_TOOLBAR_BUTTONS } from '../constants/Froala';
import { handleFileUploadEditor, handleFile } from '../helpers/FileUpload';
import FormulaGuide from './FormulaGuide';
import { disableEmailId } from '../constants/zoomCredentials';

const NewPost: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [title, setTitle] = useState('');
    const [html, setHtml] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);
    // const [message, setMessage] = useState({
    //     html: '',
    //     attachments: []
    // });
    const [customCategory, setCustomCategory] = useState('None');
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [anonymous, setAnonymous] = useState(false);
    const [equation, setEquation] = useState('');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const styles = styleObject();
    let RichText: any = useRef();

    Froalaeditor.DefineIcon('insertFormula', {
        NAME: 'formula',
        PATH: 'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z',
    });
    Froalaeditor.RegisterCommand('insertFormula', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {
            RichText.current.editor.selection.save();
            setShowEquationEditor(true);
        },
    });

    const fileUploadEditor = useCallback(
        async (files: any) => {
            console.log('File', files.item(0));
            const res = await handleFileUploadEditor(false, files.item(0), props.userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, res.name);
        },
        [props.userId]
    );

    const handleFileUpload = useCallback(async () => {
        const res = await handleFile(false, props.userId);

        if (!res || res.url === '' || res.type === '') {
            return false;
        }
        // setUploadResult(res.url, res.type);
    }, [props.userId]);

    const videoUploadEditor = useCallback(
        async (files: any) => {
            const res = await handleFileUploadEditor(true, files.item(0), props.userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, res.name);
        },
        [props.userId]
    );

    console.log('Attachments', attachments);

    const setUploadResult = useCallback(
        (uploadURL: string, uploadType: string, updloadName: string) => {
            const updatedAttachments: any[] = [...attachments];

            console.log('initial attachments', updatedAttachments);

            updatedAttachments.push({
                url: uploadURL,
                type: uploadType,
                name: updloadName,
            });

            console.log('After attachments', updatedAttachments);

            setAttachments(updatedAttachments);
        },
        [attachments]
    );

    /**
     * @description Used to insert equation into Editor HTML
     */
    const insertEquation = useCallback(() => {
        if (equation === '') {
            Alert('Equation cannot be empty.');
            return;
        }

        renderMathjax(equation).then((res: any) => {
            const random = Math.random();

            RichText.current.editor.selection.restore();

            RichText.current.editor.html.insert(
                '<img class="rendered-math-jax" id="' +
                    random +
                    '" data-eq="' +
                    encodeURIComponent(equation) +
                    '" src="' +
                    res.imgSrc +
                    '"></img>'
            );
            RichText.current.editor.events.trigger('contentChanged');

            setShowEquationEditor(false);
            setEquation('');
        });
    }, [equation, RichText, RichText.current]);

    /**
     * @description Renders option to select Category for new discussion post
     */
    const threadOptions = (
        <View
            style={{
                backgroundColor: '#fff',
                marginBottom: 20,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                maxWidth: 750,
            }}
        >
            <View style={{ flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter', marginRight: 7 }}>Category</Text>
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        backgroundColor: '#fff',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ backgroundColor: '#fff', marginRight: 10 }}>
                        {addCustomCategory ? (
                            <View style={styles.colorBar}>
                                <TextInput
                                    value={customCategory}
                                    style={{
                                        borderRadius: 2,
                                        borderColor: '#cccccc',
                                        borderWidth: 1,
                                        fontSize: 14,
                                        height: '2.75em',
                                        padding: '1em',
                                    }}
                                    placeholder={'Enter Category'}
                                    onChangeText={(val) => {
                                        setCustomCategory(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            </View>
                        ) : (
                            <label style={{ width: 180, backgroundColor: 'white' }}>
                                <Select
                                    themeVariant="light"
                                    touchUi={true}
                                    onChange={(val: any) => {
                                        setCustomCategory(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    value={customCategory}
                                    rows={props.categories.length + 1}
                                    data={props.categoriesOptions}
                                />
                            </label>
                        )}
                    </View>
                    <View style={{ backgroundColor: '#fff' }}>
                        <TouchableOpacity
                            onPress={() => {
                                if (addCustomCategory) {
                                    setCustomCategory('None');
                                    setAddCustomCategory(false);
                                } else {
                                    setCustomCategory('');
                                    setAddCustomCategory(true);
                                }
                            }}
                            style={{ backgroundColor: '#fff' }}
                        >
                            <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
                                <Ionicons
                                    name={addCustomCategory ? 'close' : 'create-outline'}
                                    size={18}
                                    color={'#1F1F1F'}
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {props.isOwner ? null : (
                <View
                    style={{
                        marginLeft: 'auto',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            marginRight: 7,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e: any) => {
                                setIsPrivate(!isPrivate);
                            }}
                        />
                    </View>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Private</Text>
                </View>
            )}
            {props.isOwner ? null : (
                <View
                    style={{
                        marginLeft: 50,
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            marginRight: 7,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={anonymous}
                            onChange={(e: any) => {
                                setAnonymous(!anonymous);
                            }}
                        />
                    </View>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Anonymous</Text>
                </View>
            )}
        </View>
    );

    // MAIN RETURN

    return (
        <View
            style={{
                width: '100%',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <View
                style={{
                    maxWidth: 750,
                    width: '100%',
                    flexDirection: 'column',
                    paddingHorizontal: 20,
                    marginVertical: 20,
                    backgroundColor: '#fff',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        position: 'relative',
                        justifyContent: 'center',
                        marginBottom: 30,
                    }}
                >
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            left: 0,
                        }}
                        onPress={() => {
                            props.onClose();
                        }}
                    >
                        <Text>
                            <Ionicons name="chevron-back-outline" size={28} color="#1f1f1f" />
                        </Text>
                    </TouchableOpacity>
                    <Text
                        style={{
                            paddingTop: 5,
                            fontSize: 18,
                            fontFamily: 'inter',
                        }}
                    >
                        New Post
                    </Text>
                </View>

                <TextInput
                    value={title}
                    style={{
                        fontFamily: 'overpass',
                        width: '100%',
                        borderWidth: 1,
                        borderColor: '#cccccc',
                        // borderBottom: '1px solid #f2f2f2',
                        fontSize: 14,
                        paddingVertical: 20,
                        paddingLeft: 10,
                        marginTop: 12,
                        marginBottom: 25,
                        borderRadius: 2,
                        height: 35,
                    }}
                    // minRows={1}
                    placeholder={'Title'}
                    onChangeText={(text: any) => setTitle(text)}
                />
                <View
                    style={{
                        width: '100%',
                        borderWidth: 1,
                        borderColor: '#cccccc',
                        borderRadius: 2,
                    }}
                >
                    <FroalaEditor
                        ref={RichText}
                        model={html}
                        onModelChange={(model: any) => {
                            setHtml(model);
                        }}
                        config={{
                            key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                            attribution: false,
                            placeholderText: 'Enter Title',
                            charCounterCount: false,
                            zIndex: 2003,
                            // immediateReactModelUpdate: true,
                            heightMin: 150,
                            // FILE UPLOAD
                            // fileUploadURL: 'https://api.learnwithcues.com/upload',
                            fileMaxSize: 25 * 1024 * 1024,
                            fileAllowedTypes: ['*'],
                            fileUploadParams: { userId: props.userId },
                            // IMAGE UPLOAD
                            imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                            imageUploadParam: 'file',
                            imageUploadParams: { userId: props.userId },
                            imageUploadMethod: 'POST',
                            imageMaxSize: 5 * 1024 * 1024,
                            imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                            // VIDEO UPLOAD
                            videoMaxSize: 50 * 1024 * 1024,
                            videoAllowedTypes: ['webm', 'ogg', 'mp3', 'mp4', 'mov'],
                            paragraphFormatSelection: true,
                            // Default Font Size
                            spellcheck: true,
                            tabSpaces: 4,

                            // TOOLBAR
                            toolbarButtons: DISCUSS_POST_TOOLBAR_BUTTONS,
                            toolbarSticky: true,
                            htmlAllowedEmptyTags: [
                                'textarea',
                                'a',
                                'iframe',
                                'object',
                                'video',
                                'style',
                                'script',
                                '.fa',
                                'span',
                                'p',
                                'path',
                                'line',
                            ],
                            htmlAllowedTags: ['.*'],
                            htmlAllowedAttrs: ['.*'],
                            htmlRemoveTags: ['script'],

                            events: {
                                'file.beforeUpload': function (files: any) {
                                    // Return false if you want to stop the file upload.
                                    fileUploadEditor(files);

                                    return false;
                                },
                                'video.beforeUpload': function (videos: any) {
                                    videoUploadEditor(videos);

                                    return false;
                                },
                                'image.beforeUpload': function (images: any) {
                                    if (images[0].size > 5 * 1024 * 1024) {
                                        alert('Image size must be less than 5mb.');
                                        return false;
                                    }

                                    return true;
                                },
                            },
                        }}
                    />
                </View>
            </View>

            {/* Render attachments */}
            {attachments.length > 0 ? (
                <View
                    style={{
                        flexDirection: 'column',
                        width: '100%',
                        maxWidth: 750,
                        marginVertical: 20,
                        paddingHorizontal: 20,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'Overpass',
                            marginBottom: 20,
                        }}
                    >
                        Attachments
                    </Text>
                    {attachments.map((file: any, ind: number) => {
                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    width: '100%',
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderWidth: 1,
                                    borderColor: '#cccccc',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderRadius: 2,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="attach-outline" size={24} color="#007AFF" />
                                <Text
                                    style={{
                                        paddingLeft: 10,
                                        fontSize: 15,
                                        fontFamily: 'Overpass',
                                    }}
                                >
                                    {file.name}
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 'auto',
                                    }}
                                    onPress={() => {
                                        const updateAttachments = [...attachments];
                                        updateAttachments.splice(ind, 1);
                                        setAttachments(updateAttachments);
                                    }}
                                >
                                    <Text>
                                        <Ionicons
                                            name="close-outline"
                                            style={{
                                                marginLeft: 'auto',
                                            }}
                                            size={21}
                                        />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {threadOptions}

            <View
                style={{
                    marginTop: 20,
                    width: '100%',
                    justifyContent: 'center',
                    marginBottom: 50,
                }}
            >
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        // overflow: 'hidden',
                        // height: 35,
                        justifyContent: 'center',
                        flexDirection: 'row',
                    }}
                    onPress={() => {
                        if (title === '') {
                            Alert('Enter a title.');
                            return;
                        }

                        if (html === '') {
                            Alert('Content cannot be empty.');
                            return;
                        }

                        console.log('Message', {
                            html,
                            attachments,
                        });

                        props.onSend(
                            title,
                            JSON.stringify({
                                html,
                                attachments,
                            }),
                            customCategory,
                            isPrivate,
                            anonymous
                        );
                    }}
                    disabled={props.user.email === disableEmailId}
                    // disabled={isCreatingEvents}
                >
                    <Text
                        style={{
                            fontWeight: 'bold',
                            textAlign: 'center',
                            borderColor: '#000',
                            borderWidth: 1,
                            color: '#fff',
                            backgroundColor: '#000',
                            fontSize: 11,
                            paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                            fontFamily: 'inter',
                            overflow: 'hidden',
                            paddingVertical: 14,
                            textTransform: 'uppercase',
                            width: 120,
                        }}
                    >
                        CREATE
                    </Text>
                </TouchableOpacity>
            </View>

            <FormulaGuide
                value={equation}
                onChange={setEquation}
                show={showEquationEditor}
                onClose={() => setShowEquationEditor(false)}
                onInsertEquation={insertEquation}
            />
        </View>
    );
};

export default NewPost;

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1,
        },
        marginSmall: {
            height: 10,
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white',
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row',
        },
        channelOption: {
            width: '33.333%',
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        allOutline: {
            fontSize: 12,
            color: '#1F1F1F',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#1F1F1F',
        },
    });
};
