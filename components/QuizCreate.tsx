// REACT
import React, { useEffect, useState, useCallback, useRef, } from 'react';
import { Dimensions, TextInput as DefaultTextInput, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TeXToSVG from "tex-to-svg";
import lodash, { update } from "lodash";
import { Ionicons } from '@expo/vector-icons';

// COMPONENTS
import parser from 'html-react-parser';
import TextareaAutosize from 'react-textarea-autosize';
import { Text, TouchableOpacity, View } from '../components/Themed';
import Alert from "../components/Alert";
import ReactPlayer from "react-player";
import { Select } from '@mobiscroll/react';
import FormulaGuide from './FormulaGuide';
import useDynamicRefs from 'use-dynamic-refs';
import { Editor } from '@tinymce/tinymce-react';

import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';

// import {
//     Menu,
//     MenuOptions,
//     MenuOption,
//     MenuTrigger,
// } from "react-native-popup-menu";

// HELPER
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleFile, handleFileUploadEditor } from '../helpers/FileUpload';

// NEW EDITOR
// Require Editor JS files.
import 'froala-editor/js/froala_editor.pkgd.min.js';

// import 'froala-editor/css/froala_editor.pkgd.min.css';
// import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';

import FroalaEditor from 'react-froala-wysiwyg';

import Froalaeditor from 'froala-editor';

import { QUIZ_QUESTION_TOOLBAR_BUTTONS, QUIZ_OPTION_TOOLBAR_BUTTONS, HIGHLIGHT_BUTTONS, INLINE_CHOICE_BUTTONS, TEXT_ENTRY_BUTTONS } from '../constants/Froala';

import { renderMathjax } from '../helpers/FormulaHelpers';

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TextInput } from './CustomTextInput';

import ImageMarker from "react-image-marker"


// import { BoardRepository, Board } from 'react-native-draganddrop-board'


// CONSTANTS
const questionTypeOptions = [
    {
        text: "MCQ",
        value: "mcq",
    },
    {
        text: "Free response",
        value: "freeResponse"
    },
    {
        text: "True/False",
        value: "trueFalse"
    },
    {
        text: "Drag & Drop",
        value: "dragdrop"
    },
    {
        text: "Hotspot",
        value: "hotspot"
    },
    {
        text: 'Highlight Text',
        value: "highlightText"
    },
    {
        text: 'Inline Choice',
        value: 'inlineChoice'
    },
    {
        text: 'Text Entry',
        value: 'textEntry'
    }
]

const requiredOptions = [
    {
        text: "Required",
        value: "required",
    },
    {
        text: "Optional",
        value: "optional",
    }
]

// if (Platform.OS === "web") {
//     Image.resolveAssetSource = (source) => { uri: source }
// }

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {


    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : [])
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [editQuestion, setEditQuestion] = useState<any>({});
    const [equation, setEquation] = useState("");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);
    const [getRef, setRef] = useDynamicRefs();
    const [optionEquations, setOptionEquations] = useState<any[]>([]);
    const [showOptionFormulas, setShowOptionFormulas] = useState<any[]>([]);
    let RichText: any = useRef();
    const [editQuestionContent, setEditQuestionContent] = useState('');
    const [equationEditorFor, setEquationEditorFor] = useState('');
    const [equationOptionId, setEquationOptionId] = useState('')
    const [getHighlightTextRef, setHighlightTextRef] = useDynamicRefs();

    console.log("Problems", problems)

    Froalaeditor.DefineIcon('insertFormulaQuestion', {
        NAME: 'formula',
        PATH:
            'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z'
    });
    Froalaeditor.RegisterCommand('insertFormulaQuestion', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {

            RichText.current.editor.selection.save();

            setEquationEditorFor('question')
            setShowEquationEditor(true);

        }
    });

    Froalaeditor.DefineIcon('insertFormulaOption', {
        NAME: 'formula',
        PATH:
            'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z'
    });
    Froalaeditor.RegisterCommand('insertFormulaOption', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {

            this.selection.save();
            // curr.editor.id

            setEquationOptionId(this.id);

            setEquationEditorFor('option')
            setShowEquationEditor(true);
        }
    });

    Froalaeditor.DefineIcon('insertChoice', { NAME: 'plus', SVG_KEY: 'add' });
    Froalaeditor.RegisterCommand('insertChoice', { 
        title: 'Insert Choice',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {

            const currentQuestion = problems[editQuestionNumber - 1]

            const currentChoices = currentQuestion.inlineChoiceOptions;

            this.html.insert(`<span id="${currentChoices.length}" class="inlineChoicePlaceholder fr-deletable" contenteditable="false">Dropdown ${currentChoices.length + 1}</span>&zwj;`);

            // const updatedProblems = [...problems]

            // updatedProblems[editQuestionNumber - 1].inlineChoiceOptions.push([{
            //     option: 'Option 1',
            //     isCorrect: true
            // }, {
            //     option: 'Option 2',
            //     isCorrect: false
            // }])

            this.events.trigger('contentChanged');

        }
    });

    Froalaeditor.DefineIcon('insertTextEntryField', { NAME: 'plus', SVG_KEY: 'add' });
    Froalaeditor.RegisterCommand('insertTextEntryField', { 
        title: 'Insert Entry',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {

            const currentQuestion = problems[editQuestionNumber - 1]

            const currentChoices = currentQuestion.textEntryOptions;

            this.html.insert(`<span id="${currentChoices.length}" class="inlineTextEntry fr-deletable" contenteditable="false">Entry ${currentChoices.length + 1}</span>&zwj;`);

            this.events.trigger('contentChanged');

        }
    });


    // HOOKS
    /**
     * @description Reset formulas when edit question changes
     */
    useEffect(() => {

        if (editQuestionNumber === 0) {
            setShowOptionFormulas([])
            setOptionEquations([])
        }

    }, [editQuestionNumber])

    /**
     * @description Inserts equation into problem
     */
    const insertEquation = useCallback(() => {

        if (equation === "") {
            Alert('Equation cannot be empty.')
            return;
        }

        if (equationEditorFor === "question") {
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

                let audioVideoQuestion = problems[editQuestionNumber - 1].question[0] === "{" && problems[editQuestionNumber - 1].question[problems[editQuestionNumber - 1].question.length - 1] === "}";

                if (audioVideoQuestion) {
                    const currQuestion = JSON.parse(problems[editQuestionNumber - 1].question);
                    const updatedQuestion = {
                        ...currQuestion,
                        content: RichText.current.editor.html.get()
                    }
                    const newProbs = [...problems];
                    newProbs[editQuestionNumber - 1].question = JSON.stringify(updatedQuestion);
                    setProblems(newProbs)
                    props.setProblems(newProbs)

                } else {
                    // setCue(modifedText);
                    const newProbs = [...problems];
                    newProbs[editQuestionNumber - 1].question = RichText.current.editor.html.get();
                    setProblems(newProbs)
                    props.setProblems(newProbs)
                }

                setShowEquationEditor(false);
                setEquationEditorFor('')
                setEquation('');
            });
        } else if (equationEditorFor === 'option') {
            renderMathjax(equation).then((res: any) => {
                const random = Math.random();

                // Find the active Ref for option to insert formula in

                let optionEditorRef: any;

                let optionIndex: number = -1;

                editQuestion.options.map((_: any, i: number) => {
                    const ref: any = getRef(i.toString());

                    if (ref && ref.current && ref.current.editor.id === equationOptionId) {
                        optionEditorRef = ref;
                        optionIndex = i
                    }
                })

                if (optionIndex === -1 || !optionEditorRef) return;


                optionEditorRef.current.editor.selection.restore();

                optionEditorRef.current.editor.html.insert(
                    '<img class="rendered-math-jax" id="' +
                    random +
                    '" data-eq="' +
                    encodeURIComponent(equation) +
                    '" src="' +
                    res.imgSrc +
                    '"></img>'
                );

                // Update problem in props
                const newProbs = [...problems];
                newProbs[editQuestionNumber - 1].options[optionIndex].option = optionEditorRef.current.editor.html.get();


                optionEditorRef.current.editor.events.trigger('contentChanged');

                setProblems(newProbs)
                props.setProblems(newProbs)


                setShowEquationEditor(false);
                setEquationEditorFor('')
                setEquation('');
            });
        }


    }, [equation, RichText, RichText.current, showEquationEditor, editQuestionNumber, problems, equationEditorFor, equationOptionId, editQuestion]);

    /**
     * @description Inserts equation for MCQ options 
     */
    const insertOptionEquation = (index: number) => {

        if (optionEquations[index] === "") {
            Alert('Equation cannot be empty.')
            return;
        }

        const ref: any = getRef(index.toString())

        if (!ref || !ref.current) return;

        let currentContent = ref.current.getContent();

        const SVGEquation = TeXToSVG(optionEquations[index], { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";

        ref.current.setContent(currentContent)

        // Update problem in props
        const newProbs = [...problems];
        newProbs[editQuestionNumber - 1].options[index].option = ref.current.getContent();

        setProblems(newProbs)
        props.setProblems(newProbs)

        const updateShowFormulas = [...showOptionFormulas];
        updateShowFormulas[index] = false;
        setShowOptionFormulas(updateShowFormulas);

        const updateOptionEquations = [...optionEquations];
        updateOptionEquations[index] = "";
        setOptionEquations(updateOptionEquations)
    }

    /**
     * @description Renders Audio/Video player 
     */
    const renderAudioVideoPlayer = (url: string, type: string) => {
        return <ReactPlayer
            url={url}
            controls={true}
            width={"100%"}
            height={type === "mp3" || type === "wav" ? "75px" : "360px"}
            onContextMenu={(e: any) => e.preventDefault()}
            config={{
                file: { attributes: { controlsList: "nodownload" } },
            }}
        />
    }

    const handleVideoImport = useCallback(async (files: any, problemIndex: number) => {

        const res = await handleFileUploadEditor(true, files.item(0), props.userId);

        if (!res || res.url === "" || res.type === "" || !RichText || !RichText.current) {
            return;
        }

        const obj = { url: res.url, type: res.type, content: RichText.current.props.model };

        const newProbs = [...problems];
        newProbs[problemIndex].question = JSON.stringify(obj);

        setProblems(newProbs)
        props.setProblems(newProbs)

    }, [props.userId, problems, editQuestionContent, editQuestion, RichText])

    useEffect(() => {

        if (editQuestionNumber !== 0) {

            const currentProblem = problems[editQuestionNumber - 1];

            let audioVideoQuestion = currentProblem.question[0] === "{" && currentProblem.question[currentProblem.question.length - 1] === "}";

            if (audioVideoQuestion) {
                const currQuestion = JSON.parse(currentProblem.question);
                const updatedQuestion = {
                    ...currQuestion,
                    content: editQuestionContent
                }
                const newProbs = [...problems];
                newProbs[editQuestionNumber - 1].question = JSON.stringify(updatedQuestion);
                setEditQuestion(newProbs[editQuestionNumber - 1])
                setProblems(newProbs)
                props.setProblems(newProbs)
            } else {
                // setCue(modifedText);
                const newProbs = [...problems];
                newProbs[editQuestionNumber - 1].question = editQuestionContent;
                setEditQuestion(newProbs[editQuestionNumber - 1])
                setProblems(newProbs)
                props.setProblems(newProbs)
            }

        }


    }, [editQuestionContent])

    /**
     * @description Renders Question editor
     */
    const renderQuestionEditor = (index: number) => {

        if (editQuestionNumber === 0) return null;

        if (problems[index].questionType === 'textEntry' || problems[index].questionType === 'inlineChoice' || problems[index].questionType === 'highlightText' ) {
            return null;
        }

        let audioVideoQuestion = problems[index].question[0] === "{" && problems[index].question[problems[index].question.length - 1] === "}";

        let url = "";
        let type = "";
        let content = "";

        if (audioVideoQuestion) {
            const parse = JSON.parse(problems[index].question);

            url = parse.url;
            content = parse.content;
            type = parse.type;
        } else {
            content = problems[index].question
        }

        return (<View >
            {audioVideoQuestion ?
                <View style={{ marginBottom: 20 }}>
                    {renderAudioVideoPlayer(url, type)}
                </View>
                : null
            }
            <FormulaGuide equation={equation} onChange={setEquation} show={showEquationEditor} onClose={() => setShowEquationEditor(false)} onInsertEquation={insertEquation} />
            <FroalaEditor
                ref={RichText}
                model={editQuestionContent}
                onModelChange={(model: any) => {
                    setEditQuestionContent(model)
                }}
                config={{
                    key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                    attribution: false,
                    placeholderText: 'Problem',
                    charCounterCount: false,
                    zIndex: 2003,
                    // immediateReactModelUpdate: true,
                    heightMin: 200,
                    fileUpload: false,
                    videoUpload: true,
                    imageUploadURL:
                        'https://api.learnwithcues.com/api/imageUploadEditor',
                    imageUploadParam: 'file',
                    imageUploadParams: { userId: props.userId },
                    imageUploadMethod: 'POST',
                    imageMaxSize: 5 * 1024 * 1024,
                    imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                    // VIDEO UPLOAD
                    videoMaxSize: 20 * 1024 * 1024,
                    videoAllowedTypes: ['webm', 'ogg', 'mp3', 'mp4', 'mov'],
                    paragraphFormatSelection: true,
                    // Default Font Size
                    fontSizeDefaultSelection: '24',
                    spellcheck: true,
                    tabSpaces: 4,

                    // TOOLBAR
                    toolbarButtons: QUIZ_QUESTION_TOOLBAR_BUTTONS,
                    toolbarSticky: false,
                    quickInsertEnabled: false,
                    events: {
                        'video.beforeUpload': function (videos: any) {

                            handleVideoImport(videos, index)

                            return false;
                        },
                        'image.beforeUpload': function (images: any) {
                            if (images[0].size > (5 * 1024 * 1024)) {
                                alert('Image size must be less than 5mb.')
                                return false;
                            }

                            return true;
                        },
                    }
                }}
            />
        </View>)
    }

    /**
     * @description Remove header associated with question when the question is removed
     */
    const removeHeadersOnDeleteProblem = (index: number) => {

        const headerPositions = Object.keys(headers);

        const headerIndicesToUpdate = headerPositions.filter((i: any) => i > index);

        const currentHeaders = JSON.parse(JSON.stringify(headers));

        delete currentHeaders[index];

        headerIndicesToUpdate.forEach((i: any) => {

            // Set i - 1

            const currHeaderValue = headers[i];

            delete currentHeaders[i];

            currentHeaders[i - 1] = currHeaderValue;

        })

        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders)


    }

    /**
     * @description Add a header to a question
     */
    const addHeader = (index: number) => {

        // Use headers as an object with key as index values
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        currentHeaders[index] = "";
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);

    }

    /**
     * @description Remove header from a question
     */
    const removeHeader = (index: number) => {

        const currentHeaders = JSON.parse(JSON.stringify(headers));
        delete currentHeaders[index];
        setHeaders(currentHeaders)
        props.setHeaders(currentHeaders);

    }

    /**
     * @description Renders the Header for question at index
     */
    const renderHeaderOption = (index: number) => {
        return <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }} >
            {index in headers
                ?
                <View style={{ flexDirection: 'row', width: '100%', marginTop: 50, marginBottom: 20 }}>
                    <View style={{ width: Dimensions.get('window').width < 768 ? '80%' : '50%' }}>
                        <TextareaAutosize
                            style={{
                                fontFamily: 'overpass',
                                maxWidth: '100%', marginBottom: 10, marginTop: 10,
                                borderRadius: 1,
                                paddingTop: 13, paddingBottom: 13, fontSize: 14, borderBottom: '1px solid #C1C9D2',
                            }}
                            value={headers[index]}
                            placeholder={'Heading'}
                            onChange={(e: any) => {
                                const currentHeaders = JSON.parse(JSON.stringify(headers))
                                currentHeaders[index] = e.target.value
                                setHeaders(currentHeaders);
                                props.setHeaders(currentHeaders)
                            }}
                            minRows={1}
                        />
                    </View>
                    <View style={{ paddingTop: 35, paddingLeft: 20 }}>
                        <Text
                            style={{
                                color: '#006AFF',
                                fontFamily: 'Overpass',
                                fontSize: 10
                            }}
                            onPress={() => {
                                removeHeader(index)
                            }}
                        >
                            Remove
                        </Text>
                    </View>
                </View>
                :
                (editQuestionNumber === (index + 1) ? <TouchableOpacity
                    onPress={() => addHeader(index)}
                    style={{
                        backgroundColor: "white",
                        overflow: "hidden",
                        height: 35,
                        marginTop: 15,
                        marginBottom: 15,
                        // width: "100%",
                        justifyContent: "center",
                        flexDirection: "row",
                    }}
                >
                    <Text
                        style={{
                            color: '#006AFF',
                            borderWidth: 1,
                            borderRadius: 15,
                            borderColor: '#006AFF',
                            backgroundColor: '#fff',
                            fontSize: 12,
                            textAlign: "center",
                            lineHeight: 34,
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            textTransform: 'uppercase',
                            width: 175,
                        }}
                    >
                        Add Header
                    </Text>
                </TouchableOpacity> : null)}
        </View>
    }

    /**
     * @description Checks if current question is valid before proceeding to modifying different question
     */
    const isCurrentQuestionValid = (index: number) => {

        if (editQuestionNumber === 0) return true;

        const currentQuestion = problems[index];

        if (currentQuestion.question === "" && (currentQuestion.questionType !== 'textEntry' && currentQuestion.questionType !== 'inlineChoice' && currentQuestion.questionType !== 'highlightText')) {
            alert(`Question ${index + 1} has no content.`)
            return false;
        }

        if (currentQuestion.points === "") {
            alert(`Enter points for Question ${index + 1}.`)
            return false;
        }

        if (currentQuestion.questionType === "" && currentQuestion.options.length < 2) {
            alert(`Create at least 2 options for Question ${index + 1}.`)
            return false;
        }

        // MCQs, True & false
        if ((currentQuestion.questionType === "" || currentQuestion.questionType === "trueFalse")) {

            let error = false;

            const keys: any = {};

            let optionFound = false;

            currentQuestion.options.map((option: any) => {
                if (option.option === "" || option.option === "formula:") {
                    alert(`Fill missing option for Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.option in keys) {
                    alert(`Option repeated in a Question ${index + 1}.`);
                    error = true;
                    return;
                }

                if (option.isCorrect) {
                    optionFound = true;
                }

                keys[option.option] = 1;
            });

            if (!optionFound || error) {
                alert(`Select a correct answer for Question ${index + 1}.`)
                return false;
            }

        }

        // Hotspot
        if (currentQuestion.questionType === 'hotspot') {
            if (!currentQuestion.imgUrl || currentQuestion.imgUrl === '') {
                Alert(`Hotspot image is missing in Question ${index + 1}`)
                return;
            }

            if (currentQuestion.hotspots.length === 0) {
                Alert(`You must place at least one hotspot marker on the image in Question ${index + 1}`);
                return;
            }
        }

        // Drag and Drop
        if (currentQuestion.questionType === 'dragdrop') {
            let groupHeaderMissing = false 
            let labelMissing = false
            let groupEmpty = false

            currentQuestion.dragDropHeaders.map((header: string) => {
                if (!header) {
                    groupHeaderMissing = true
                }
            });

            if (groupHeaderMissing) {
                alert(`Group header is missing in Question ${index + 1}.`)
                return false;
            }

            currentQuestion.dragDropData.map((items: any[]) => {

                if (items.length === 0) {
                    groupEmpty = true
                }

                items.map((label: any) => {
                    if (label.content === '') {
                        labelMissing = true
                    }
                })

            });

            if (labelMissing) {
                alert(`Item missing in Question ${index + 1}.`)
                return false;
            }

            if (groupEmpty) {
                alert(`Each group must have at least 1 item in Question ${index + 1}.`)
                return false;
            }

        }

        // Highlight Text
        if (currentQuestion.questionType === 'highlightText') {

            if (currentQuestion.highlightTextChoices.length < 2) {
                Alert(`You must set multiple highlight text choices and mark one as correct in Question ${index + 1}`);
                return;
            }

            let atleastOneCorrect = false;

            currentQuestion.highlightTextChoices.map((choice: boolean) => {
                if (choice) {
                    atleastOneCorrect = true;
                }
            })

            if (!atleastOneCorrect) {
                Alert(`You must set at least one highlight text choice as correct in Question ${index + 1}`);
                return;
            }
            
        }

        // Inline Choice
        if (currentQuestion.questionType === 'inlineChoice') {
            if (currentQuestion.inlineChoiceHtml === '') {
                alert(`Question ${index + 1} has no content.`)
                return;
            }

            if (currentQuestion.inlineChoiceOptions.length === 0) {
                alert(`Inline choice question ${index + 1} must have at lease one dropdown.`)
                return;
            }
            
            let lessThan2DropdownValues = false
            let missingDropdownValue = false;
            let missingCorrectAnswer = false;

            if (currentQuestion.inlineChoiceOptions.length > 0) {
                currentQuestion.inlineChoiceOptions.map((choices: any[], index: number) => {
                    if (choices.length < 2) {
                        lessThan2DropdownValues = true
                    }

                    let hasCorrect = false
                    choices.map((choice: any) => {
                        if (choice.isCorrect) {
                            hasCorrect = true
                        }

                        if (choice.option === '') {
                            missingDropdownValue = true
                        }
                    })

                    if (!hasCorrect) {
                        missingCorrectAnswer = true
                    }

                })

                if (lessThan2DropdownValues) {
                    alert(`Each dropdown in question ${index + 1} must have at lease two options.`)
                    return;
                }

                if (missingDropdownValue) {
                    alert(`Each dropdown option must have a value in question ${index + 1}.`)
                    return;
                }

                if (missingCorrectAnswer) {
                    alert(`Each dropdown must have a correct answer in question ${index + 1}.`)
                    return;
                }
            }

        }

        // Text Entry
        if (currentQuestion.questionType === 'textEntry') {
            if (currentQuestion.textEntryHtml === '') {
                alert(`Question ${index + 1} has no content.`)
                return;
            }

            if (currentQuestion.textEntryOptions.length === 0) {
                alert(`Text entry question ${index + 1} must have at lease one entry.`)
                return;
            }

            let missingEntryAnswer = false;
            let missingEntryPoints = false;

            currentQuestion.textEntryOptions.map((choice: any, index: number) => {
                if (choice.option === '') {
                    missingEntryAnswer = true;
                }

                if (choice.points === '') {
                    missingEntryPoints = true
                }

            })

            if (missingEntryAnswer) {
                alert(`Each Text entry option must have an answer in question ${index + 1}.`)
                return;
            }

            if (missingEntryPoints) {
                alert(`Each Text entry must have points in question ${index + 1}.`)
                return;
            }

        }

        return true;

    }

    // Web drag and drop
    /**
    * @description Moves an item from one list to another list.
    */
    const move = (source: any, destination: any, droppableSource: any, droppableDestination: any) => {
        const sourceClone = Array.from(source);

        const destClone = Array.from(destination);

        const [removed] = sourceClone.splice(droppableSource.index, 1);

        destClone.splice(droppableDestination.index, 0, removed);

        const result: any = {};
        result[droppableSource.droppableId] = sourceClone;
        result[droppableDestination.droppableId] = destClone;

        return result;
    };

    const grid = 8;

    const getItemStyle = (isDragging: any, draggableStyle: any) => ({
        // some basic styles to make the items look a bit nicer
        userSelect: "none",
        padding: 16,
        margin: `0 0 ${grid}px 0`,

        // change background colour if dragging
        background: "#fff",

        // styles we need to apply on draggables
        ...draggableStyle,
        // height: 25
        marginBottom: 15,
        top: draggableStyle.top,
        borderRadius: 10,
    });
    const getListStyle = (isDraggingOver: any) => ({
        background: "#f2f2f2",
        padding: 15,
        width: 200,
        minWidth: 200,
        margin: 15
    });

    const reorder = (list: any, startIndex: any, endIndex: any) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };



    // MAIN RETURN 

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            maxWidth: 900,
            borderTopRightRadius: 0,
            marginTop: 35,
            paddingTop: 25,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
        >
            {showFormulaGuide ? <FormulaGuide show={showFormulaGuide} onClose={() => setShowFormulaGuide(false)} /> : null}

            {/* Insert HEADER FOR INDEX 0 */}
            {
                problems.map((problem: any, index: any) => {
                    const { questionType } = problem;

                    // Dropdown doesn't accept empty strings
                    let dropdownQuestionType = questionType !== "" ? questionType : "mcq"

                    let requiredDropdown = problem.required ? "required" : 'optional'

                    // Audio/Video question

                    let audioVideoQuestion = problem.question[0] === "{" && problem.question[problem.question.length - 1] === "}";

                    let url = "";
                    let content = "";
                    let type = "";

                    const dndOptions: string[] = [];

                    if (editQuestionNumber !== (index + 1) && problem.questionType === 'dragdrop') {
                        problem.dragDropData.map((group: any) => {
                            group.map((label: any) => {
                                dndOptions.push(label.content)
                            })
                        })
                    }

                    const dragDropOptions = (dndOptions)

                    if (audioVideoQuestion) {
                        const parse = JSON.parse(problem.question);

                        url = parse.url;
                        content = parse.content;
                        type = parse.type;
                    }

                    // Highlight text editor ref
                    const highlightTextProblemEditorRef: any = setHighlightTextRef(index.toString());

                    return <View
                        key={index}
                        style={{ borderBottomColor: '#f2f2f2', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, paddingBottom: 25, width: '100%' }}>
                        {renderHeaderOption(index)}
                        <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 15 }}>
                            <View style={{ paddingTop: 15, flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>
                                <Text style={{ color: '#000000', fontSize: 22, paddingBottom: 25, width: 40, paddingTop: 15, fontFamily: 'inter' }}>
                                    {index + 1}.
                                </Text>

                                {/* Question */}
                                <View style={{ flexDirection: Dimensions.get('window').width < 768 || editQuestionNumber === (index + 1) ? (editQuestionNumber === (index + 1) ? 'column-reverse' : 'column') : 'row', flex: 1 }}>

                                    <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1, paddingRight: Dimensions.get('window').width < 768 ? 0 : 20 }}>
                                        <View style={{ width: '100%', }}>
                                            {(editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row', marginTop: audioVideoQuestion ? 10 : 0, marginBottom: audioVideoQuestion ? 10 : 0, justifyContent: 'flex-end' }}>
                                                {audioVideoQuestion ?
                                                    <TouchableOpacity onPress={() => {
                                                        const updateProblems = lodash.cloneDeep(problems);
                                                        const question = updateProblems[index].question;
                                                        const parse = JSON.parse(question);
                                                        updateProblems[index].question = parse.content;
                                                        setProblems(updateProblems)
                                                        props.setProblems(updateProblems)
                                                    }}>
                                                        <Text style={{
                                                            color: '#006AFF',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10,
                                                        }}> Clear</Text>
                                                    </TouchableOpacity>
                                                    :
                                                    null
                                                }
                                            </View> : null)}
                                            {
                                                (editQuestionNumber === (index + 1) ? renderQuestionEditor(index) : (audioVideoQuestion ? <View style={{}}>
                                                    <View style={{ marginBottom: 20 }}>
                                                        {renderAudioVideoPlayer(url, type)}
                                                    </View>
                                                    <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                        {parser(content)}
                                                    </Text>
                                                </View> : <Text style={{ marginTop: 15, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                    {parser(problem.question)}
                                                </Text>))
                                            }

                                            {/* Render all other Equation Editors here */}
                                            {
                                                problem.questionType === 'highlightText' && editQuestionNumber === (index + 1) ?
                                                <FroalaEditor
                                                    ref={highlightTextProblemEditorRef}
                                                    model={problems[index].highlightTextHtml}
                                                    onModelChange={(model: any) => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].highlightTextHtml = model;

                                                        // Extract SPAN Tags from HTML 
                                                        var el = document.createElement('html');
                                                        el.innerHTML = model;
                                                        const spans: HTMLCollection = el.getElementsByTagName('span');

                                                        const highlightTextChoices: boolean[] = [];

                                                        Array.from(spans).map((span: any) => {
                                                            if (span.style.backgroundColor === 'rgb(97, 189, 109)') {
                                                                highlightTextChoices.push(true);
                                                            } else {
                                                                highlightTextChoices.push(false);
                                                            }
                                                        })

                                                        newProbs[index].highlightTextChoices = highlightTextChoices;

                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)
                                                    }}
                                                    config={{
                                                        key:
                                                            'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                        attribution: false,
                                                        placeholderText: 'Highlight correct answers with green and rest with yellow.',
                                                        charCounterCount: false,
                                                        zIndex: 2003,
                                                        // immediateReactModelUpdate: true,
                                                        heightMin: 200,
                                                        fileUpload: false,
                                                        videoUpload: false,
                                                        imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                                                        imageUploadParam: 'file',
                                                        imageUploadParams: { userId: props.userId },
                                                        imageUploadMethod: 'POST',
                                                        imageMaxSize: 5 * 1024 * 1024,
                                                        imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                                        paragraphFormatSelection: true,
                                                        colorsBackground: ['#61BD6D', '#F7DA64', 'REMOVE'],
                                                        colorsHEXInput: false,
                                                        pastePlain: true,
                                                        // Default Font Size
                                                        fontSizeDefaultSelection: '24',
                                                        spellcheck: true,
                                                        tabSpaces: 4,
                                                        // TOOLBAR
                                                        toolbarButtons: HIGHLIGHT_BUTTONS,
                                                        toolbarSticky: false,
                                                        quickInsertEnabled: false
                                                        }}
                                                    /> : null
                                        }

                                        {
                                            problem.questionType === 'inlineChoice' && editQuestionNumber === (index + 1) ?
                                                <FroalaEditor
                                                    ref={highlightTextProblemEditorRef}
                                                    model={problems[index].inlineChoiceHtml}
                                                    onModelChange={(model: any) => {
                                                        const newProbs = [...problems];
                                                        newProbs[index].inlineChoiceHtml = model;

                                                        // Extract SPAN Tags from HTML 
                                                        var el = document.createElement('html');
                                                        el.innerHTML = model;

                                                        const spans: HTMLCollection = el.getElementsByTagName('span')

                                                        console.log("Spans", spans)

                                                        let updateInlineChoices: any[] = problems[index].inlineChoiceOptions;

                                                        // Added choice
                                                        if (updateInlineChoices.length < Array.from(spans).length) {
                                                            updateInlineChoices.push([{
                                                                option: 'Option 1',
                                                                isCorrect: true
                                                            }, {
                                                                option: 'Option 2',
                                                                isCorrect: false
                                                            }])
                                                        } else if (updateInlineChoices.length > Array.from(spans).length && Array.from(spans).length !== 0) {
                                                            // A span was deleted so need to update all the existing inlineChoiceOptions

                                                            let deletedInd = -1;
                                                            const deleteCount = updateInlineChoices.length - Array.from(spans).length;

                                                            // 0, 1, 2, 3

                                                            // 1 is deleted, then 2 => 1 and 3 => 2

                                                            // 0, 1, 2, 3, 4, 5 

                                                            // 2, 3 are deleted 4 => 2, 5 => 3

                                                            // Span list goes from 5 -> 3

                                                            const spanList = Array.from(spans)
                                                            updateInlineChoices.map((choice: any, ind: number) => {

                                                                if (deletedInd !== -1) return;

                                                                // Check if #id of ind exist in spans
                                                                if (!spans[ind] || spans[ind].id !== ind.toString()) {
                                                                    deletedInd = ind
                                                                } 
                                                                
                                                            })

                                                            console.log("DeletedInd", deletedInd)
                                                            console.log("deleteCount", deleteCount)

                                                            updateInlineChoices.splice(deletedInd, deleteCount);

                                                            // Update all span tags
                                                            spanList.map((s: any, i: number) => {

                                                                if (spans[i].id === i.toString()) return;

                                                                const html = `<span id="${i}" class="inlineChoicePlaceholder fr-deletable" contenteditable="false">Dropdown ${i + 1}</span>&zwj;`

                                                                var x, tmp, elm, last, target = document.getElementById(s.id);
                                                                /// create a temporary div or tr (to support tds)
                                                                tmp = document.createElement(html.indexOf('<td')!=-1?'tr':'div');

                                                                console.log("tmp", tmp);

                                                                /// fill that div with our html, this generates our children
                                                                tmp.innerHTML = html;
                                                                /// step through the temporary div's children and insertBefore our target
                                                                x = tmp.childNodes.length;
                                                                /// the insertBefore method was more complicated than I first thought so I 
                                                                /// have improved it. Have to be careful when dealing with child lists as  
                                                                /// they are counted as live lists and so will update as and when you make
                                                                /// changes. This is why it is best to work backwards when moving children 
                                                                /// around, and why I'm assigning the elements I'm working with to `elm` 
                                                                /// and `last`
                                                                last = target;
                                                                console.log("Target", target)
                                                                while(x--){
                                                                    target.parentNode.insertBefore((elm = tmp.childNodes[x]), last);
                                                                    last = elm;
                                                                }
                                                                /// remove the target.
                                                                target.parentNode.removeChild(target);

                                                            })



                                                            // Now loop over all the spans and update them from 

                                                        } else if (Array.from(spans).length === 0) {
                                                            // Reset
                                                            updateInlineChoices = []
                                                        }

                                                        newProbs[index].inlineChoiceOptions = updateInlineChoices
                                                        console.log("Update inline choices", updateInlineChoices)

                                                        setProblems(newProbs)
                                                        props.setProblems(newProbs)

                                                    }}
                                                    config={{
                                                        key:
                                                            'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                        attribution: false,
                                                        placeholderText: '',
                                                        charCounterCount: false,
                                                        zIndex: 2003,
                                                        // immediateReactModelUpdate: true,
                                                        heightMin: 200,
                                                        fileUpload: false,
                                                        videoUpload: false,
                                                        imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                                                        imageUploadParam: 'file',
                                                        imageUploadParams: { userId: props.userId },
                                                        imageUploadMethod: 'POST',
                                                        imageMaxSize: 5 * 1024 * 1024,
                                                        imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                                        paragraphFormatSelection: true,
                                                        colorsBackground: ['#61BD6D', '#F7DA64', 'REMOVE'],
                                                        colorsHEXInput: false,
                                                        pastePlain: true,
                                                        // Default Font Size
                                                        fontSizeDefaultSelection: '24',
                                                        spellcheck: true,
                                                        tabSpaces: 4,
                                                        // TOOLBAR
                                                        toolbarButtons: INLINE_CHOICE_BUTTONS,
                                                        toolbarSticky: false,
                                                        quickInsertEnabled: false
                                                        }}
                                                    /> : null
                                                
                                        }

                                        {
                                        problem.questionType === 'textEntry' && editQuestionNumber === (index + 1) ?
                                            <FroalaEditor
                                                ref={highlightTextProblemEditorRef}
                                                model={problems[index].textEntryHtml}
                                                onModelChange={(model: any) => {
                                                    const newProbs = [...problems];
                                                    newProbs[index].textEntryHtml = model;

                                                    // Extract SPAN Tags from HTML 
                                                    var el = document.createElement('html');
                                                    el.innerHTML = model;

                                                    const spans: HTMLCollection = el.getElementsByTagName('span')

                                                    console.log("Spans", spans)

                                                    console.log("Text entry model", model)

                                                    let updateTextEntryOptions: any[] = problems[index].textEntryOptions;

                                                    // Added choice
                                                    if (updateTextEntryOptions.length < Array.from(spans).length) {
                                                        updateTextEntryOptions.push({
                                                            option: '',
                                                            type: 'text',
                                                            points: '1'
                                                        })
                                                    } else if (updateTextEntryOptions.length > Array.from(spans).length && Array.from(spans).length !== 0) {
                                                        // A span was deleted so need to update all the existing inlineChoiceOptions

                                                        let deletedInd = -1;
                                                        const deleteCount = updateTextEntryOptions.length - Array.from(spans).length;

                                                        // 0, 1, 2, 3

                                                        // 1 is deleted, then 2 => 1 and 3 => 2

                                                        // 0, 1, 2, 3, 4, 5 

                                                        // 2, 3 are deleted 4 => 2, 5 => 3

                                                        // Span list goes from 5 -> 3

                                                        const spanList = Array.from(spans)
                                                        updateTextEntryOptions.map((choice: any, ind: number) => {

                                                            if (deletedInd !== -1) return;

                                                            // Check if #id of ind exist in spans
                                                            if (!spans[ind] || spans[ind].id !== ind.toString()) {
                                                                deletedInd = ind
                                                            } 
                                                            
                                                        })

                                                        console.log("DeletedInd", deletedInd)
                                                        console.log("deleteCount", deleteCount)

                                                        updateTextEntryOptions.splice(deletedInd, deleteCount);

                                                        // Update all span tags
                                                        spanList.map((s: any, i: number) => {

                                                            if (spans[i].id === i.toString()) return;

                                                            const html = `<span id="${i}" class="inlineTextEntry fr-deletable" contenteditable="false">Entry ${i + 1}</span>&zwj;`

                                                            var x, tmp, elm, last, target = document.getElementById(s.id);
                                                            /// create a temporary div or tr (to support tds)
                                                            tmp = document.createElement(html.indexOf('<td')!=-1?'tr':'div');

                                                            console.log("tmp", tmp);

                                                            /// fill that div with our html, this generates our children
                                                            tmp.innerHTML = html;
                                                            /// step through the temporary div's children and insertBefore our target
                                                            x = tmp.childNodes.length;
                                                            /// the insertBefore method was more complicated than I first thought so I 
                                                            /// have improved it. Have to be careful when dealing with child lists as  
                                                            /// they are counted as live lists and so will update as and when you make
                                                            /// changes. This is why it is best to work backwards when moving children 
                                                            /// around, and why I'm assigning the elements I'm working with to `elm` 
                                                            /// and `last`
                                                            last = target;
                                                            console.log("Target", target)
                                                            while(x--){
                                                                target.parentNode.insertBefore((elm = tmp.childNodes[x]), last);
                                                                last = elm;
                                                            }
                                                            /// remove the target.
                                                            target.parentNode.removeChild(target);

                                                        })



                                                        // Now loop over all the spans and update them from 

                                                    } else if (Array.from(spans).length === 0) {
                                                        // Reset
                                                        updateTextEntryOptions = []
                                                    }

                                                    newProbs[index].textEntryOptions = updateTextEntryOptions
                                                    console.log("Update text entry choices", updateTextEntryOptions)

                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)

                                                }}
                                                config={{
                                                    key:
                                                        'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                    attribution: false,
                                                    placeholderText: '',
                                                    charCounterCount: false,
                                                    zIndex: 2003,
                                                    // immediateReactModelUpdate: true,
                                                    heightMin: 200,
                                                    fileUpload: false,
                                                    videoUpload: false,
                                                    imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                                                    imageUploadParam: 'file',
                                                    imageUploadParams: { userId: props.userId },
                                                    imageUploadMethod: 'POST',
                                                    imageMaxSize: 5 * 1024 * 1024,
                                                    imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                                    paragraphFormatSelection: true,
                                                    colorsBackground: ['#61BD6D', '#F7DA64', 'REMOVE'],
                                                    colorsHEXInput: false,
                                                    pastePlain: true,
                                                    // Default Font Size
                                                    fontSizeDefaultSelection: '24',
                                                    spellcheck: true,
                                                    tabSpaces: 4,
                                                    // TOOLBAR
                                                    toolbarButtons: TEXT_ENTRY_BUTTONS,
                                                    toolbarSticky: false,
                                                    quickInsertEnabled: false
                                                    }}
                                                /> : null
                                            
                                    }

                                        </View>
                                    </View>

                                    {/* Options */}
                                    <View style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        // width: '100%',
                                        maxWidth: 900,
                                        marginTop: Dimensions.get('window').width < 768 ? 0 : 0,
                                        marginBottom: Dimensions.get('window').width < 768 ? 20 : 0,
                                    }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            {editQuestionNumber === (index + 1) ? <View
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 15,
                                                    alignItems: 'flex-start',
                                                    paddingBottom: Dimensions.get('window').width < 768 ? 0 : 30,
                                                }}>
                                                <label style={{ width: 160 }}>
                                                    <Select
                                                        touchUi={true}
                                                        cssClass="customDropdown"
                                                        value={dropdownQuestionType}
                                                        rows={questionTypeOptions.length}
                                                        data={questionTypeOptions}
                                                        themeVariant="light"
                                                        onChange={(val: any) => {
                                                            const updatedProblems = [...problems]
                                                            if (val.value === "mcq") {
                                                                updatedProblems[index].questionType = "";
                                                            } else {
                                                                updatedProblems[index].questionType = val.value;
                                                                updatedProblems[index].options = []
                                                            }

                                                            // hotspots
                                                            updatedProblems[index].hotspots = []
                                                            updatedProblems[index].hotspotOptions = []
                                                            updatedProblems[index].imgUrl = ''

                                                            // drag and drop
                                                            if (val.value === 'dragdrop') {
                                                                updatedProblems[index].questionType = 'dragdrop'
                                                                updatedProblems[index].options = []
                                                                updatedProblems[index].dragDropData = [
                                                                    [
                                                                        {
                                                                            id: '0',
                                                                            content: ''
                                                                        },
                                                                    ],
                                                                    [
                                                                        { 
                                                                            id: '1',
                                                                            content: '' 
                                                                        },
                                                                    ]
                                                                ]
                                                                updatedProblems[index].dragDropHeaders = ['', '']
                                                            } else {
                                                                // clear data if not drag and drop
                                                                updatedProblems[index].dragDropData = []
                                                                updatedProblems[index].dragDropHeaders = []
                                                                updatedProblems[index].options = []
                                                            }


                                                            // Clear Options 
                                                            if (val.value === "freeResponse") {
                                                                updatedProblems[index].options = []
                                                            } else if (val.value === "trueFalse") {
                                                                updatedProblems[index].options = []
                                                                updatedProblems[index].options.push({
                                                                    option: 'True',
                                                                    isCorrect: false
                                                                })
                                                                updatedProblems[index].options.push({
                                                                    option: 'False',
                                                                    isCorrect: false
                                                                })
                                                            }

                                                            updatedProblems[index].textEntryHtml = ''
                                                            updatedProblems[index].textEntryOptions = []

                                                            updatedProblems[index].inlineChoiceHtml = ''
                                                            updatedProblems[index].inlineChoiceOptions = []

                                                            if (val.value !== 'highlightText') {
                                                                updatedProblems[index].highlightTextHtml = ''
                                                                updatedProblems[index].highlightTextChoices = []
                                                            } 
                                                            
                                                            setProblems(updatedProblems)
                                                            props.setProblems(updatedProblems)

                                                        }}
                                                        responsive={{
                                                            small: {
                                                                display: 'bubble'
                                                            },
                                                            medium: {
                                                                touchUi: false,
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </View> : null}

                                            {editQuestionNumber === (index + 1) ?
                                                <View
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        paddingTop: Dimensions.get('window').width < 768 ? 0 : 15,
                                                        paddingLeft: 20,
                                                        alignItems: 'flex-start',
                                                        paddingBottom: Dimensions.get('window').width < 768 ? 0 : 30,
                                                    }}>
                                                    <label style={{ width: 160 }}>
                                                        <Select
                                                            touchUi={true}
                                                            cssClass="customDropdown"
                                                            value={requiredDropdown}
                                                            rows={requiredOptions.length}
                                                            data={requiredOptions}
                                                            themeVariant="light"
                                                            onChange={(val: any) => {
                                                                const updatedProblems = [...problems]
                                                                updatedProblems[index].required = (val.value === "required")
                                                                setProblems(updatedProblems)
                                                                props.setProblems(updatedProblems)
                                                            }}
                                                            responsive={{
                                                                small: {
                                                                    display: 'bubble'
                                                                },
                                                                medium: {
                                                                    touchUi: false,
                                                                }
                                                            }}
                                                        />
                                                    </label>

                                                </View> : null
                                            }
                                        </View>
                                        {
                                            Dimensions.get('window').width < 768 ? null : <View style={{ flex: 1 }} />
                                        }
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 15, marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 'none' }}>
                                            {editQuestionNumber === (index + 1) ? null : (!problem.required ?
                                                null
                                                : (<Text style={{ fontSize: 20, fontFamily: 'inter', color: 'black', marginBottom: 5, marginRight: 10, paddingTop: 8 }}>
                                                    *
                                                </Text>))}
                                            <DefaultTextInput
                                                value={editQuestionNumber === (index + 1) ? problem.points : ((problem.points === "" ? "Enter" : problem.points) + " " + (Number(problem.points) === 1 ? 'Point' : 'Points'))}
                                                editable={editQuestionNumber === (index + 1)}
                                                style={{
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: 8,
                                                    paddingBottom: 12,
                                                    width: 120,
                                                    marginLeft: editQuestionNumber === (index + 1) ? 20 : 0,
                                                    textAlign: 'center',
                                                    marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30,
                                                    fontWeight: editQuestionNumber === (index + 1) ? 'normal' : '700',
                                                    borderBottomColor: '#f2f2f2',
                                                    borderBottomWidth: editQuestionNumber === (index + 1) ? 1 : 0,
                                                }}
                                                placeholder={PreferredLanguageText('enterPoints')}
                                                onChangeText={val => {
                                                    if (Number.isNaN(Number(val))) return;
                                                    const newProbs = [...problems];
                                                    newProbs[index].points = val;
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                }}
                                                placeholderTextColor={'#a2a2ac'}
                                            />

                                            <View style={{ paddingTop: editQuestionNumber === (index + 1) ? 10 : 5, flexDirection: 'row', alignItems: 'flex-end', marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30, }}>
                                                {editQuestionNumber === (index + 1) ?
                                                    <View style={{ flexDirection: 'row', paddingLeft: 20 }}>

                                                        <Ionicons
                                                            name='trash-outline'
                                                            color={"#006AFF"}
                                                            onPress={() => {
                                                                Alert(`Delete Question ${editQuestionNumber} ?`, "", [
                                                                    {
                                                                        text: "Cancel",
                                                                        style: "cancel",
                                                                    },
                                                                    {
                                                                        text: "Clear",
                                                                        onPress: () => {
                                                                            const updatedProblems = [...problems]
                                                                            updatedProblems.splice(index, 1);
                                                                            removeHeadersOnDeleteProblem(index + 1);
                                                                            setProblems(updatedProblems)
                                                                            props.setProblems(updatedProblems)
                                                                            setEditQuestionNumber(0);
                                                                            setEditQuestion({});
                                                                            setEditQuestionContent('')
                                                                        },
                                                                    },
                                                                ])
                                                            }}
                                                            size={23}
                                                        />
                                                    </View> : <Ionicons
                                                        name='cog-outline'
                                                        color={'#006AFF'}
                                                        style={{
                                                            // paddingTop: 4
                                                        }}
                                                        onPress={() => {
                                                            if (isCurrentQuestionValid(editQuestionNumber - 1)) {
                                                                setEditQuestionNumber(index + 1)
                                                                // set edit question the one from problems array

                                                                let initialAudioVideo = problems[index].question[0] === "{" && problems[index].question[problems[index].question.length - 1] === "}";

                                                                let initialContent = "";

                                                                if (initialAudioVideo) {
                                                                    const parse = JSON.parse(problems[index].question);
                                                                    initialContent = parse.content;
                                                                } else {
                                                                    initialContent = problems[index].question
                                                                }

                                                                const currentProblems: any[] = lodash.cloneDeep(problems)

                                                                setEditQuestion({ ...currentProblems[index], question: initialContent })

                                                                setEditQuestionContent(initialContent)
                                                            }

                                                        }}
                                                        size={20}
                                                    />}
                                            </View>
                                        </View>
                                    </View>

                                </View>

                            </View>

                        </View>
                        {
                            problem.questionType === "freeResponse" ? <Text style={{
                                marginTop: 20,
                                fontSize: 15,
                                marginLeft: 20,
                                paddingTop: 12,
                                paddingLeft: Dimensions.get('window').width < 768 ? 0 : 40,
                                paddingBottom: 40,
                                width: '100%',
                                color: "#a2a2ac",
                                marginBottom: 20,
                            }}>
                                Free Response Answer
                            </Text> : null
                        }

                        {
                            problem.questionType === 'textEntry' && editQuestionNumber !== (index + 1)  ?
                                <View style={{ paddingTop: editQuestionNumber === (index + 1) ? 20 : 0 }}>
                                    {ReactHtmlParser(problems[index].textEntryHtml, {
                                        transform: (node: any, ind1: any) => {
                                            if (node.type === 'tag' && node.name === 'p') {

                                                node.attribs.style = 'line-height: 40px; font-family: Overpass; font-size: 15px;'

                                                const textEntryOptions = problems[index].textEntryOptions

                                                return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                    if (node.type === 'tag' && node.name === 'span') {

                                                        const option = textEntryOptions[Number(node.attribs.id)];

                                                        const type = option.type;
                                                        const value = option.option;
            
                                                        return <input style={{
                                                            border: '1px solid #DDD',
                                                            padding: 5,
                                                            borderRadius: 3,
                                                            fontFamily: 'Overpass'
                                                        }} type={type} value={value} disabled={true}  />;
                                                    }
                                                });
                                            } else {
                                                return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                    if (node.type === 'tag' && node.name === 'span') {
                                                        const textEntryOptions = problems[index].textEntryOptions

                                                        const option = textEntryOptions[Number(node.attribs.id)];

                                                        const type = option.type;
                                                        const value = option.option;
            
                                                        return <input style={{
                                                            border: '1px solid #DDD',
                                                            padding: 5,
                                                            borderRadius: 3,
                                                            fontFamily: 'Overpass'
                                                        }} type={type} value={value} disabled={true} />;
                                                    }
                                                });
                                            }

                                        } 
                                    })}
                                </View> : null
                        }

                        {
                            problem.questionType === 'textEntry' && (editQuestionNumber === (index + 1)) ? <View style={{ paddingTop: 30, flexDirection: 'row', overflow: 'scroll' }}>
                                {
                                    problems[index].textEntryOptions.map((choice: any, choiceIndex: number) => {

                                        const textEntryOptionTypes = [
                                            {
                                                text: 'Text',
                                                value: 'text'
                                            }, 
                                            {
                                                text: 'Numbers',
                                                value: 'number'
                                            }
                                        ]

                                        return <div style={{
                                            flexDirection: 'column',
                                            // backgroundColor: "#f2f2f2",
                                            padding: 15,
                                            width: 280,
                                            minWidth: 280,
                                            marginRight: 30,
                                            borderRadius: 15,
                                            border: '1px solid #cccccc'
                                        }}>
                                            

                                            {/* <View style={{
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                backgroundColor: "#f2f2f2",
                                            }}> */}
                                                <View style={{ flexDirection: 'column', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 15, marginBottom: 15, borderRadius: 10 }}>
                                                    
                                                    <Text style={{
                                                        width: '100%',
                                                        fontSize: 16,
                                                        fontFamily: 'Inter',
                                                        paddingBottom: 20,
                                                        textAlign: 'center'
                                                    }}> Entry {choiceIndex + 1}</Text>

                                                    <View style={{ 
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginBottom: 20
                                                    }}>

                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#000000',
                                                                fontFamily: 'Inter',
                                                                marginRight: 20
                                                            }}
                                                        >
                                                            Answer
                                                        </Text>

                                                        <DefaultTextInput
                                                            style={{
                                                                width: 150,
                                                                borderColor: '#e8e8e8',
                                                                borderBottomWidth: 1,
                                                                fontSize: 14,
                                                                paddingTop: 13,
                                                                paddingBottom: 13,
                                                                marginTop: 0,
                                                                paddingHorizontal: 10,
                                                                marginLeft: 10,
                                                                marginBottom: 0
                                                            }}
                                                            multiline={true}
                                                            value={choice.option}
                                                            placeholder=""
                                                            onChangeText={(text) => {
                                                                const updatedProblems = [...problems]
                                                                updatedProblems[index].textEntryOptions[choiceIndex].option = text
                                                                setProblems(updatedProblems)
                                                                props.setProblems(updatedProblems)
                                                            }}
                                                        />
                                                    </View>

                                                    <View style={{ 
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginBottom: 20
                                                    }}>

                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#000000',
                                                                fontFamily: 'Inter',
                                                                marginRight: 20
                                                            }}
                                                        >
                                                            Type
                                                        </Text>

                                                        <label style={{ width: 150, marginLeft: 10 }}>
                                                            <Select
                                                                touchUi={true}
                                                                cssClass="customDropdown"
                                                                value={problems[index].textEntryOptions[choiceIndex].type}
                                                                rows={textEntryOptionTypes.length}
                                                                data={textEntryOptionTypes}
                                                                themeVariant="light"
                                                                onChange={(val: any) => {
                                                                    const updatedProblems = [...problems]
                                                                    updatedProblems[index].textEntryOptions[choiceIndex].type = val.value
                                                                    setProblems(updatedProblems)
                                                                    props.setProblems(updatedProblems)
                                                                }}
                                                                responsive={{
                                                                    small: {
                                                                        display: 'bubble'
                                                                    },
                                                                    medium: {
                                                                        touchUi: false,
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </View>

                                                    <View style={{ 
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}>

                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#000000',
                                                                fontFamily: 'Inter',
                                                                marginRight: 20
                                                            }}
                                                        >
                                                            Points
                                                        </Text>
                                                        <DefaultTextInput
                                                            style={{
                                                                width: 150,
                                                                borderColor: '#e8e8e8',
                                                                borderBottomWidth: 1,
                                                                fontSize: 14,
                                                                paddingTop: 13,
                                                                paddingBottom: 13,
                                                                marginTop: 0,
                                                                paddingHorizontal: 10,
                                                                marginLeft: 10,
                                                                marginBottom: 0
                                                            }}
                                                            placeholder=''
                                                            multiline={true}
                                                            value={choice.points}
                                                            onChangeText={(text) => {
                                                                const updatedProblems = [...problems]
                                                                updatedProblems[index].textEntryOptions[choiceIndex].points = text
                                                                setProblems(updatedProblems)
                                                                props.setProblems(updatedProblems)
                                                            }}
                                                        />
                                                    </View>
                                                    
                                                    {/* <TouchableOpacity
                                                        style={{
                                                            backgroundColor: 'rgba(0,0,0,0)',
                                                            paddingLeft: 10
                                                        }}
                                                        onPress={() => {
                                                            const updatedProblems = [...problems];
                                                            updatedProblems[index].textEntryOpions[choiceIndex].splice(optionIndex, 1);
                                                            setProblems(
                                                                updatedProblems
                                                            );
                                                            props.setProblems(updatedProblems)                                                                 
                                                        }}
                                                    >
                                                        <Ionicons name='trash-outline' color='#1f1f1f' size={15} />
                                                    </TouchableOpacity> */}

                                                </View>

                                            {/* </View> */}

                                        </div>
                                    })
                                }
                            </View> : null
                        }

                        {
                            problem.questionType === 'inlineChoice' && editQuestionNumber !== (index + 1)  ?
                                <View style={{ paddingTop: editQuestionNumber === (index + 1) ? 20 : 0 }}>
                                    {ReactHtmlParser(problems[index].inlineChoiceHtml, {
                                        transform: (node: any, ind1: any) => {
                                            if (node.type === 'tag' && node.name === 'p') {

                                                node.attribs.style = 'line-height: 40px; font-family: Overpass; font-size: 15px;'

                                                const inlineChoiceOptions = problems[index].inlineChoiceOptions


                                                return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                    if (node.type === 'tag' && node.name === 'span') {


                                                        const options = inlineChoiceOptions[Number(node.attribs.id)];

            
                                                        return <span style={{ width: 160 }}>
                                                            <select style={{
                                                                border: '1px solid #DDD',
                                                                padding: 5,
                                                                borderRadius: 3,
                                                                fontFamily: 'Overpass'
                                                            }}>
                                                                {
                                                                    options.map((option: any) => {
                                                                        return <option value={option.option}>{option.option}</option>
                                                                    })
                                                                }
                                                            </select>
                                                        </span>;
                                                    }
                                                });
                                            }

                                        } 
                                    })}
                                </View> : null
                        }

                        { 
                            problem.questionType === 'highlightText' ? <View style={{ paddingTop: editQuestionNumber === (index + 1) ? 20 : 0 }}>
                                {ReactHtmlParser(problems[index].highlightTextHtml, {
                                    transform: (node: any, ind1: any) => {
                                        if (node.type === 'tag' && node.name === 'p') {

                                            node.attribs.style = 'line-height: 40px; font-family: Overpass; font-size: 15px;'

                                            const highlightTextHtml = problems[index].highlightTextHtml
                                            const highlightTextChoices = problems[index].highlightTextChoices

                                            var el = document.createElement('html');
                                            el.innerHTML = highlightTextHtml;
                                            const spans: HTMLCollection = el.getElementsByTagName('span')

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {

                                                    let matchIndex = -1; 

                                                    // Loop over all the 
                                                    Array.from(spans).map((elm: any, ind3: number) => {
                                                        if (((!node.next && !elm.nextSibling) || node.next.data === elm.nextSibling.data) && ((!node.prev && !node.previousSibling) || node.prev.data === elm.previousSibling.data) && node.children[0].data === elm.firstChild.data) {
                                                            matchIndex = ind3;
                                                        }
                                                    })

                                                    console.log("Match index", matchIndex)
                                                    console.log("highlightTextChoices", highlightTextChoices)


                                                    let isCorrect = matchIndex !== -1 ? highlightTextChoices[matchIndex] : false
        
                                                    return <span className={isCorrect ? "highlightTextActive" : "highlightTextOption"}>{node.children[0].data}</span>;
                                                }
                                            });
                                        }

                                    } 
                                })}
                            </View> : null
                        }

                        {
                            problem.questionType === 'inlineChoice' && (editQuestionNumber === (index + 1)) ? <View style={{ paddingTop: 20, flexDirection: 'row', overflow: 'scroll' }}>
                                {
                                    problems[index].inlineChoiceOptions.map((choice: any[], choiceIndex: number) => {
                                        return <View style={{
                                            flexDirection: 'column',
                                            backgroundColor: "#f2f2f2",
                                            padding: 30,
                                            width: 280,
                                            minWidth: 280,
                                            margin: 15,
                                            // borderRadius: 15,
                                        }}>
                                            <Text style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                                paddingBottom: 15,
                                                textAlign: 'center'
                                            }}> Dropdown {choiceIndex + 1}</Text>
                                            <View style={{
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                backgroundColor: "#f2f2f2",
                                            }}>
                                                {
                                                    choice.map((option: any, optionIndex: number) => {
                                                        return <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 15, marginBottom: 15, borderRadius: 10 }}>
                                                            <input
                                                                style={{}}
                                                                type='checkbox'
                                                                checked={option.isCorrect}
                                                                onChange={(e) => {
                                                                    const updatedProblems = [...problems]
                                                                    updatedProblems[index].inlineChoiceOptions[choiceIndex][optionIndex].isCorrect = !updatedProblems[index].inlineChoiceOptions[choiceIndex][optionIndex].isCorrect
                                                                    setProblems(updatedProblems)
                                                                    props.setProblems(updatedProblems)
                                                                }}
                                                                disabled={editQuestionNumber !== (index + 1)}
                                                            />
                                                            
                                                            <DefaultTextInput
                                                                style={{
                                                                    width: 150,
                                                                    borderColor: '#e8e8e8',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 14,
                                                                    paddingTop: 13,
                                                                    paddingBottom: 13,
                                                                    marginTop: 0,
                                                                    paddingHorizontal: 10,
                                                                    marginLeft: 10,
                                                                    marginBottom: 0
                                                                }}
                                                                multiline={true}
                                                                value={option.option}
                                                                onChangeText={(text) => {
                                                                    const updatedProblems = [...problems]
                                                                    updatedProblems[index].inlineChoiceOptions[choiceIndex][optionIndex].option = text
                                                                    setProblems(updatedProblems)
                                                                    props.setProblems(updatedProblems)
                                                                }}
                                                            />
                                                            <TouchableOpacity
                                                                style={{
                                                                    backgroundColor: 'rgba(0,0,0,0)',
                                                                    paddingLeft: 10
                                                                }}
                                                                onPress={() => {
                                                                    const updatedProblems = [...problems];
                                                                    updatedProblems[index].inlineChoiceOptions[choiceIndex].splice(optionIndex, 1);
                                                                    setProblems(
                                                                        updatedProblems
                                                                    );
                                                                    props.setProblems(updatedProblems)                                                                 
                                                                }}
                                                            >
                                                                <Ionicons name='trash-outline' color='#1f1f1f' size={15} />
                                                            </TouchableOpacity>

                                                        </View>
                                                    })
                                                }
                                            </View>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    const updatedProblems = [...problems]
                                                    updatedProblems[index].inlineChoiceOptions[choiceIndex].push({
                                                        isCorrect: false,
                                                        option: 'Option ' + (updatedProblems[index].inlineChoiceOptions[choiceIndex].length + 1)
                                                    })
                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                                style={{
                                                    backgroundColor: "#f2f2f2",
                                                    overflow: "hidden",
                                                    height: 30,
                                                    marginTop: 15,
                                                    alignSelf: 'center'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#006AFF',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        borderColor: '#006AFF',
                                                        backgroundColor: '#f2f2f2',
                                                        fontSize: 11,
                                                        textAlign: "center",
                                                        lineHeight: 30,
                                                        paddingHorizontal: 20,
                                                        fontFamily: "inter",
                                                        height: 30,
                                                        textTransform: 'uppercase',
                                                        width: 130,
                                                    }}
                                                >
                                                    Add
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    })
                                }
                            </View> : null
                        }
                        

                        {
                            problem.questionType === 'hotspot' ? (
                                !problem.imgUrl || problem.imgUrl === '' ?
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const url = await handleFile(false, props.userId, true)
                                            const updatedProblems = [...problems]
                                            if (url) {
                                                updatedProblems[index].imgUrl = url.url
                                            }
                                            setProblems(updatedProblems)
                                            props.setProblems(updatedProblems)
                                        }}
                                        style={{
                                            backgroundColor: "white",
                                            overflow: "hidden",
                                            height: 35,
                                            marginTop: 15,
                                            alignSelf: 'center'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: '#006AFF',
                                                borderWidth: 1,
                                                borderRadius: 15,
                                                borderColor: '#006AFF',
                                                backgroundColor: '#fff',
                                                fontSize: 12,
                                                textAlign: "center",
                                                lineHeight: 34,
                                                paddingHorizontal: 20,
                                                fontFamily: "inter",
                                                height: 35,
                                                textTransform: 'uppercase',
                                                width: 175,
                                            }}
                                        >
                                            Upload Image
                                        </Text>
                                    </TouchableOpacity>
                                    :
                                    <View style={{
                                        paddingLeft: 40, overflow: 'hidden', display: 'flex', flexDirection: 'row', justifyContent: 'center',
                                    }}>
                                        <View style={{
                                            maxWidth: Dimensions.get('window').width < 768 ? 300 : 600, maxHeight: Dimensions.get('window').width < 768 ? 300 : 600,
                                        }}>
                                            <ImageMarker
                                                src={problem.imgUrl}
                                                markers={problem.hotspots.map((spot: any) => {
                                                    return { top: spot.y, left: spot.x }
                                                })}
                                                onAddMarker={(marker: any) => {
                                                    // setMarkers([...markers, marker])

                                                    if (editQuestionNumber !== (index + 1)) {
                                                        return;
                                                    }

                                                    const updatedProblems = [...problems]

                                                    updatedProblems[index].hotspots = [...updatedProblems[index].hotspots, {
                                                        x: marker.left, y: marker.top
                                                    }]
                                                    updatedProblems[index].hotspotOptions = [...updatedProblems[index].hotspotOptions, {
                                                        option: '',
                                                        isCorrect: false
                                                    }]

                                                    console.log("Markers", updatedProblems[index].hotspots);

                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                                markerComponent={(p: any) => {
                                                   
                                                    const hotspotOption = problem.hotspotOptions[p.itemNumber]; 
                                                    
                                                    return <TouchableOpacity style={{
                                                        backgroundColor: hotspotOption.isCorrect ? '#006AFF' : '#fff',
                                                        height: 25, 
                                                        width: 25, 
                                                        borderColor: '#006AFF', 
                                                        borderWidth: 1,
                                                        borderRadius: 12.5
                                                    }}
                                                        onPress={() => {
                                                            // return
                                                            if (editQuestionNumber !== (index + 1)) {
                                                                return;
                                                            } 

                                                            const updatedProblems = [...problems]
                                                            updatedProblems[index].hotspots.splice(p.itemNumber, 1)
                                                            updatedProblems[index].hotspotOptions.splice(p.itemNumber, 1)
                                                            setProblems(updatedProblems)
                                                            props.setProblems(updatedProblems)

                                                            
                                                        }}
                                                    >
                                                        <Text style={{
                                                            color: hotspotOption.isCorrect ? '#fff' : '#006AFF', 
                                                            lineHeight: 25, 
                                                            textAlign: 'center',
                                                        }}>
                                                            {p.itemNumber + 1}
                                                        </Text>
                                                    </TouchableOpacity>}
                                                }
                                            />
                                        </View>
                                    </View>
                            ) : null
                        }

                         {/* Hotspot Preview */}

                         {/* {
                            problem.questionType === 'hotspot' && editQuestionNumber !== (index + 1) && (problem.imgUrl && problem.imgUrl !== '')
                            ? <View style={{
                                paddingLeft: 40, overflow: 'hidden', display: 'flex', flexDirection: 'row', justifyContent: 'center',
                            }}>
                                <View style={{
                                    maxWidth: Dimensions.get('window').width < 768 ? 300 : 600, maxHeight: Dimensions.get('window').width < 768 ? 300 : 600,
                                }}>
                                    <ImageMarker
                                        src={problem.imgUrl}
                                        markers={problem.hotspots.map((spot: any) => {
                                            return { top: spot.y, left: spot.x }
                                        })}
                                        onAddMarker={(marker: any) => { 
                                           return;
                                        }}
                                        markerComponent={(p: any) => {

                                            const hotspotOption = problem.hotspotOptions[p.itemNumber];


                                            return <TouchableOpacity disabled={true} style={{
                                                backgroundColor: hotspotOption.isCorrect ? '#006AFF' : '#fff',
                                                height: 25, 
                                                width: 25, 
                                                borderColor: '#006AFF',
                                                borderRadius: 12.5
                                            }}
                                                onPress={() => {
                                                    return;
                                                }}
                                            >
                                                <Text style={{
                                                    color: hotspotOption.isCorrect ? '#fff' : '#006AFF', 
                                                    lineHeight: 25, 
                                                    textAlign: 'center'
                                                }}>
                                                    {p.itemNumber + 1}
                                                </Text>
                                            </TouchableOpacity>}
                                        }
                                    />
                                </View>
                                
                            </View> : null
                        } */}

                        {
                            problem.questionType === 'hotspot' && problem.imgUrl !== '' ? ( 
                                <View style={{
                                    paddingTop: 50
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center'
                                    }}>
                                        {
                                            problem.hotspotOptions.map((option: any, ind: number) => {
                                                console.log('Hotspot', option)
                                                return (<View style={{ 
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginRight: 30,
                                                    marginBottom: 30
                                                }}>

                                                    <input
                                                        style={{
                                                            marginRight: 12
                                                        }}
                                                        type='checkbox'
                                                        checked={option.isCorrect}
                                                        onChange={(e) => {
                                                            const updatedProblems = [...problems]
                                                            updatedProblems[index].hotspotOptions[ind].isCorrect = !updatedProblems[index].hotspotOptions[ind].isCorrect
                                                            setProblems(updatedProblems)
                                                            props.setProblems(updatedProblems)
                                                        }}
                                                        disabled={editQuestionNumber !== (index + 1)}
                                                    />

                                                    {editQuestionNumber === (index + 1) ? <Text style={{ fontSize: 20 }}>{ind + 1}.</Text> : null}

                                                    {editQuestionNumber === (index + 1) ? <DefaultTextInput
                                                        style={{
                                                            width: 150,
                                                            borderColor: '#e8e8e8',
                                                            borderBottomWidth: 1,
                                                            fontSize: 14,
                                                            paddingTop: 13,
                                                            paddingBottom: 13,
                                                            marginTop: 0,
                                                            paddingHorizontal: 10,
                                                            marginLeft: 10,
                                                            marginBottom: 0
                                                        }}
                                                        value={option.option}
                                                        placeholder={''}
                                                        onChangeText={(val: any) => {
                                                            const updatedProblems = [...problems]
                                                            updatedProblems[index].hotspotOptions[ind].option = val
                                                            setProblems(updatedProblems)
                                                            props.setProblems(updatedProblems)
                                                        }}
                                                    /> : <div className={option.isCorrect ? 'highlightTextActive' : 'highlightTextOption'}>
                                                        {ind + 1}. {option.option}
                                                    </div>}

                                                </View>)
                                            })
                                        }
                                    </View>
                                </View>
                            ) : null
                        }

                       

                        {
                            problem.questionType === 'dragdrop' && editQuestionNumber !== (index + 1) ?
                                <div style={{
                                    display: 'flex', flexDirection: 'column', width: '100%',
                                    marginBottom: 20
                                }}>
                                    <div style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        background: '#f2f2f2',
                                        padding: 20,
                                    }}>
                                        {
                                            dragDropOptions.map((label: string) => {
                                                return <View style={{
                                                    width: 150,
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: 12,
                                                    marginRight: 20,
                                                    marginBottom: 20
                                                }}>
                                                    <Ionicons name={"ellipsis-vertical-outline"} size={16} color="#1f1f1f" />
                                                    <Text
                                                        style={{
                                                            width: '100%',
                                                            marginLeft: 5
                                                        }}
                                                    >
                                                        {label}
                                                    </Text>
                                                </View>
                                            })
                                        }
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        overflow: 'scroll',
                                        marginTop: 50
                                    }}>
                                        {problem.dragDropHeaders.map((header: string) => {
                                            return <View style={{ width: 200, marginRight: 20, justifyContent: 'center', padding: 20, backgroundColor: '#f2f2f2', }}>
                                                <Text style={{
                                                    fontSize: 16,
                                                    width: '100%',
                                                    textAlign: 'center',
                                                    marginBottom: 20,    
                                                    fontFamily: 'Inter'           
                                                }}>
                                                    {header}
                                                </Text>
                                            </View>
                                        })}
                                    </div>
                                </div>
                                : null
                        }
                        {
                            problem.questionType === 'dragdrop' && editQuestionNumber === (index + 1) ?
                                <div style={{
                                    display: 'flex', flexDirection: 'column', width: '100%'
                                }}>
                                    {/* Set groups */}
                                    <div>
                                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    const updatedProblems = [...problems]
                                                    updatedProblems[index].dragDropData = [...updatedProblems[index].dragDropData, []]
                                                    updatedProblems[index].dragDropHeaders = [...updatedProblems[index].dragDropHeaders, '']
                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                                style={{
                                                    backgroundColor: "white",
                                                    overflow: "hidden",
                                                    height: 35,
                                                    marginTop: 15,
                                                    alignSelf: 'center'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#006AFF',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        borderColor: '#006AFF',
                                                        backgroundColor: '#fff',
                                                        fontSize: 12,
                                                        textAlign: "center",
                                                        lineHeight: 34,
                                                        paddingHorizontal: 20,
                                                        fontFamily: "inter",
                                                        height: 35,
                                                        textTransform: 'uppercase',
                                                        width: 175,
                                                    }}
                                                >
                                                    New Group
                                                </Text>
                                            </TouchableOpacity>
                                            <View style={{ width: 25 }} />
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    const updatedProblems = [...problems]

                                                    const id = Math.round(Math.random() * 100000).toString()
                                                    
                                                    // Add to the most recent column
                                                    const lastGroup = Object.keys(updatedProblems[index].dragDropData).length - 1;

                                                    const updatedData = lodash.clone(updatedProblems[index].dragDropData)

                                                    updatedData[lastGroup] = [...updatedData[lastGroup], { id, content: '' }]

                                                    updatedProblems[index].dragDropData = updatedData

                                                    updatedProblems[index].dragDropHeaders = [...updatedProblems[index].dragDropHeaders]

                                                    setProblems(updatedProblems)

                                                    props.setProblems(updatedProblems)

                                                }}
                                                style={{
                                                    backgroundColor: "white",
                                                    overflow: "hidden",
                                                    height: 35,
                                                    marginTop: 15,
                                                    alignSelf: 'center'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#006AFF',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        borderColor: '#006AFF',
                                                        backgroundColor: '#fff',
                                                        fontSize: 12,
                                                        textAlign: "center",
                                                        lineHeight: 34,
                                                        paddingHorizontal: 20,
                                                        fontFamily: "inter",
                                                        height: 35,
                                                        textTransform: 'uppercase',
                                                        width: 175,
                                                    }}
                                                >
                                                    New Item
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        <div style={{ display: 'flex', width: '100%', paddingTop: 20, overflow: 'scroll', flexDirection: 'row' }}>
                                            <DragDropContext
                                                onDragEnd={(result: any) => {

                                                    const { source, destination } = result;

                                                    // dropped outside the list
                                                    if (!destination) {
                                                        return;
                                                    }
                                                    const sInd = +source.droppableId;
                                                    const dInd = +destination.droppableId;

                                                    if (sInd === dInd) {

                                                        const updatedProbs: any[] = [...problems]
                                                        const items = reorder(updatedProbs[index].dragDropData[sInd], source.index, destination.index);
                                                        const newState = [...updatedProbs[index].dragDropData];
                                                        newState[sInd] = items;
                                                        updatedProbs[index].dragDropData = newState
                                                        setProblems(updatedProbs);
                                                        props.setProblems(updatedProbs)

                                                    } else {

                                                        const updatedProbs: any[] = [...problems]
                                                        const result = move(updatedProbs[index].dragDropData[sInd], updatedProbs[index].dragDropData[dInd], source, destination);
                                                        const newState = [...updatedProbs[index].dragDropData];
                                                        newState[sInd] = result[sInd];
                                                        newState[dInd] = result[dInd];
                                                        updatedProbs[index].dragDropData = newState
                                                        setProblems(updatedProbs);
                                                        props.setProblems(updatedProbs)
                                                    }

                                                }}>
                                                {problem.dragDropData.map((el: any, ind2: any) => (
                                                    <Droppable key={ind2} droppableId={`${ind2}`}>
                                                        {(provided: any, snapshot: any) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                style={getListStyle(snapshot.isDraggingOver)}
                                                                {...provided.droppableProps}
                                                            >
                                                                <div style={{
                                                                    marginBottom: 20
                                                                }}>
                                                                    <TextInput
                                                                        style={{
                                                                            width: '90%',
                                                                            maxWidth: '90%',
                                                                            borderBottomWidth: 1,
                                                                            borderBottomColor: '#e8e8e8',
                                                                            fontSize: 14,
                                                                            paddingTop: 13,
                                                                            paddingBottom: 13,
                                                                            marginTop: 0,
                                                                            marginBottom: 5,
                                                                            padding: '10px',
                                                                            backgroundColor: '#f2f2f2'
                                                                        }}
                                                                        value={problem.dragDropHeaders[ind2]}
                                                                        placeholder={'Group ' + (ind2 + 1)}
                                                                        onChangeText={(val: any) => {
                                                                            const updatedProblems = [...problems]
                                                                            updatedProblems[index].dragDropHeaders[ind2] = val
                                                                            setProblems(updatedProblems)
                                                                            props.setProblems(updatedProblems)
                                                                        }}
                                                                        // minRows={1}
                                                                    />

                                                                </div>
                                                                {el.map((item: any, index2: any) => (
                                                                    <Draggable
                                                                        key={item.id}
                                                                        draggableId={item.id}
                                                                        index={index2}
                                                                    >
                                                                        {(provided: any, snapshot: any) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                style={getItemStyle(
                                                                                    snapshot.isDragging,
                                                                                    provided.draggableProps.style
                                                                                )}
                                                                            >
                                                                                <div
                                                                                    style={{
                                                                                        display: "flex",
                                                                                        justifyContent: "space-around",
                                                                                        alignItems: 'center'
                                                                                    }}
                                                                                >
                                                                                    {/* <TextInput
                                                                                        style={{
                                                                                            width: 150,
                                                                                            borderColor: '#e8e8e8',
                                                                                            borderBottomWidth: 1,
                                                                                            fontSize: 14,
                                                                                            paddingTop: 13,
                                                                                            paddingBottom: 13,
                                                                                            marginTop: 0,
                                                                                            marginBottom: 5,
                                                                                            paddingHorizontal: 10
                                                                                        }}
                                                                                        multiline={true}
                                                                                        value={item.content}
                                                                                        onChangeText={(text) => {
                                                                                            const updatedProblems = [...problems]
                                                                                            updatedProblems[index].dragDropData[ind2][index2].content = text
                                                                                            setProblems(updatedProblems)
                                                                                            props.setProblems(updatedProblems)
                                                                                        }}
                                                                                    /> */}
                                                                                    <TextareaAutosize
                                                                                        style={{
                                                                                            width: 150,
                                                                                            borderBottom: '1px solid #e8e8e8',
                                                                                            fontSize: 14,
                                                                                            paddingTop: 13,
                                                                                            paddingBottom: 13,
                                                                                            marginTop: 0,
                                                                                            padding: '10px',
                                                                                            marginRight: 5
                                                                                        }}
                                                                                        value={item.content}
                                                                                        placeholder={'Label'}
                                                                                        onChange={(e: any) => {
                                                                                            const updatedProblems = [...problems]
                                                                                            updatedProblems[index].dragDropData[ind2][index2].content = e.target.value
                                                                                            setProblems(updatedProblems)
                                                                                            props.setProblems(updatedProblems)
                                                                                        }}
                                                                                        minRows={1}
                                                                                    />
                                                                                    <TouchableOpacity
                                                                                        style={{
                                                                                            backgroundColor: 'rgba(0,0,0,0)',
                                                                                            paddingLeft: 5,
                                                                                            paddingTop: 5
                                                                                        }}
                                                                                        onPress={() => {
                                                                                            const updatedProblems = [...problems];
                                                                                            updatedProblems[index].dragDropData[ind2].splice(index2, 1);
                                                                                            // const newProb = updatedProblems[index].dragDropData.filter((group: any, i: any) => {
                                                                                            //     if (group.length === 0) {
                                                                                            //         updatedProblems[index].headers.splice(i, 1)
                                                                                            //     }
                                                                                            //     return group.length
                                                                                            // })
                                                                                            // updatedProblems[index].dragDropData = updatedProblems
                                                                                            setProblems(
                                                                                                updatedProblems
                                                                                            );
                                                                                            props.setProblems(updatedProblems)
                                                                                        }}
                                                                                    >
                                                                                        <Ionicons name='trash-outline' color='#1f1f1f' size={15} />
                                                                                    </TouchableOpacity>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                ))}
                                            </DragDropContext>
                                        </div>
                                    </div>

                                </div>
                                : null
                        }
                        {
                            problem.options.map((option: any, i: any) => {

                                const currRef: any = setRef(i.toString());

                                return <View style={{ flexDirection: 'row', marginTop: 10, backgroundColor: 'none', width: '100%' }} >
                                    <View style={{ paddingTop: 25, width: 40 }}>
                                        <input
                                            style={{}}
                                            type='checkbox'
                                            checked={option.isCorrect}
                                            onChange={(e) => {
                                                const updatedProblems = [...problems]
                                                if (questionType === "trueFalse") {
                                                    updatedProblems[index].options[0].isCorrect = false;
                                                    updatedProblems[index].options[1].isCorrect = false;
                                                }
                                                updatedProblems[index].options[i].isCorrect = !updatedProblems[index].options[i].isCorrect;
                                                setProblems(updatedProblems)
                                                props.setProblems(updatedProblems)
                                            }}
                                            disabled={editQuestionNumber !== (index + 1)}
                                        />
                                    </View>
                                    <View style={{ width: Dimensions.get('window').width < 768 ? '100%' : '70%', paddingRight: 30, paddingBottom: 10 }}>
                                        {
                                            <View style={{ width: '100%', marginBottom: 10 }}>
                                                {questionType === "trueFalse" || editQuestionNumber !== (index + 1) ?
                                                    <Text style={{ marginTop: 22, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                        {parser(option.option)}
                                                    </Text>
                                                    :
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <FormulaGuide
                                                            equation={optionEquations[i]}
                                                            onChange={(eq: any) => {
                                                                const updateOptionEquations = [...optionEquations]
                                                                updateOptionEquations[i] = eq;
                                                                setOptionEquations(updateOptionEquations)
                                                            }}
                                                            show={showOptionFormulas[i]}
                                                            onClose={() => {
                                                                const updateShowFormulas = [...showOptionFormulas]
                                                                updateShowFormulas[i] = !updateShowFormulas[i]
                                                                setShowOptionFormulas(updateShowFormulas)
                                                            }}
                                                            onInsertEquation={() => insertOptionEquation(i)}
                                                        />

                                                        <FroalaEditor
                                                            ref={currRef}
                                                            model={editQuestion && editQuestion.options && editQuestion.options[i] && editQuestion.options[i].option !== "" ? editQuestion.options[i].option : ""}
                                                            onModelChange={(model: any) => {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = model;
                                                                setEditQuestion(newProbs[index])
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }}
                                                            config={{
                                                                key:
                                                                    'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                                attribution: false,
                                                                placeholderText: 'Option ' + (i + 1),
                                                                charCounterCount: false,
                                                                zIndex: 2003,
                                                                // immediateReactModelUpdate: true,
                                                                heightMin: 150,
                                                                fileUpload: false,
                                                                videoUpload: false,
                                                                imageUploadURL:
                                                                    'https://api.learnwithcues.com/api/imageUploadEditor',
                                                                imageUploadParam: 'file',
                                                                imageUploadParams: { userId: props.userId },
                                                                imageUploadMethod: 'POST',
                                                                imageMaxSize: 5 * 1024 * 1024,
                                                                imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                                                paragraphFormatSelection: true,
                                                                // Default Font Size
                                                                fontSizeDefaultSelection: '24',
                                                                spellcheck: true,
                                                                tabSpaces: 4,
                                                                // TOOLBAR
                                                                toolbarButtons: QUIZ_OPTION_TOOLBAR_BUTTONS,
                                                                toolbarSticky: false,
                                                                quickInsertEnabled: false
                                                            }}
                                                        />

                                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 10, paddingTop: 20 }}>
                                                            {questionType === "trueFalse" ? null :
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: '#fff', marginLeft: 20
                                                                    }}
                                                                    onPress={() => {
                                                                        const updatedProblems = lodash.cloneDeep(problems)
                                                                        updatedProblems[index].options.splice(i, 1);
                                                                        setProblems(updatedProblems)
                                                                        props.setProblems(updatedProblems)
                                                                        setEditQuestion(updatedProblems[index])

                                                                        const updateOptionEquations: any[] = optionEquations.splice(i, 1);
                                                                        setOptionEquations(updateOptionEquations)

                                                                        const updateShowFormulas: any[] = showOptionFormulas.splice(i, 1);
                                                                        setShowOptionFormulas(updateShowFormulas)
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            paddingTop: showOptionFormulas[i] ? 10 : 0,
                                                                            color: '#006AFF',
                                                                            fontFamily: 'Overpass',
                                                                            fontSize: 10
                                                                        }}
                                                                    >
                                                                        Remove
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            }
                                                        </View>

                                                    </View>}


                                            </View>
                                        }
                                    </View>
                                </View>
                            })
                        }

                        {/* Only show Add Choice if questionType is MCQ ("") */}

                        {questionType === "" && editQuestionNumber === (index + 1) ? <TouchableOpacity
                            onPress={() => {
                                const updatedProblems = [...problems]

                                if (updatedProblems[index].options && updatedProblems[index].options.length !== 0) {
                                    updatedProblems[index].options.push({
                                        option: '',
                                        isCorrect: false
                                    })
                                } else {
                                    updatedProblems[index].options = [{
                                        option: '',
                                        isCorrect: false
                                    }]
                                }

                                setEditQuestion(updatedProblems[index])
                                setProblems(updatedProblems)
                                props.setProblems(updatedProblems)

                                const updateOptionEquations: any[] = [...optionEquations];
                                updateOptionEquations.push("");
                                setOptionEquations(updateOptionEquations)

                                const updateShowFormulas: any[] = [...showOptionFormulas];
                                updateShowFormulas.push(false);
                                setShowOptionFormulas(updateShowFormulas)
                            }} style={{
                                backgroundColor: "white",
                                overflow: "hidden",
                                height: 35,
                                marginTop: 15,
                                alignSelf: 'center'
                            }}
                        >
                            <Text
                                style={{
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    borderColor: '#006AFF',
                                    backgroundColor: '#fff',
                                    fontSize: 12,
                                    textAlign: "center",
                                    lineHeight: 34,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    height: 35,
                                    textTransform: 'uppercase',
                                    width: 175,
                                }}
                            >
                                Add Choice
                            </Text>
                        </TouchableOpacity> : <View style={{ height: 30 }} />}
                    </View>
                })
            }
            <View style={{
                width: '100%', flexDirection: 'row',
                justifyContent: 'center',
                paddingBottom: 25,
            }}>
                <TouchableOpacity
                    onPress={() => {

                        if (!isCurrentQuestionValid(editQuestionNumber - 1)) {
                            return;
                        }
                        const updatedProblems = [...problems, { question: '', options: [], points: '', questionType: '', required: true }]
                        setEditQuestionNumber(problems.length + 1)
                        setEditQuestion({ question: '', options: [] })
                        setEditQuestionContent('')
                        setProblems(updatedProblems)
                        props.setProblems(updatedProblems)
                    }}
                    style={{
                        borderRadius: 15,
                        backgroundColor: "white",
                    }}
                >
                    <Text
                        style={{
                            textAlign: "center",
                            lineHeight: 34,
                            color: "white",
                            fontSize: 12,
                            backgroundColor: "#006AFF",
                            borderRadius: 15,
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            overflow: "hidden",
                            height: 35,
                            width: 175,
                            textTransform: "uppercase",
                        }}>
                        Add Question
                    </Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default QuizCreate;