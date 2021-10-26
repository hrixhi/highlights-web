import React, { useEffect, useState, useCallback, useRef, createRef } from 'react';
import { StyleSheet, Image, Dimensions, Keyboard, TextInput as DefaultTextInput } from 'react-native';
import { TextInput } from "./CustomTextInput";
import { Text, TouchableOpacity, View } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import EquationEditor from 'equation-editor-react';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from "@react-native-picker/picker";
import TeXToSVG from "tex-to-svg";

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from "react-native-popup-menu";

import { WebView } from 'react-native-webview';
import parser from 'html-react-parser';

import TextareaAutosize from 'react-textarea-autosize';

import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";

import Alert from "../components/Alert";

import FileUpload from "./UploadFiles";

import ReactPlayer from "react-player";

import { Select } from '@mobiscroll/react';

import FormulaGuide from './FormulaGuide';

import useDynamicRefs from 'use-dynamic-refs';

import { Editor } from '@tinymce/tinymce-react';

import lodash from "lodash";

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
    }
]

const QuizCreate: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems ? props.problems : [])
    const [headers, setHeaders] = useState<any>(props.headers ? props.headers : {});
    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [editQuestion, setEditQuestion] = useState<any>({});
    const [height, setHeight] = useState(100);
    const [equation, setEquation] = useState("");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);
    const [getRef, setRef] = useDynamicRefs();
    const [optionEquations, setOptionEquations] = useState<any[]>([]);
    const [showOptionFormulas, setShowOptionFormulas] = useState<any[]>([]);

    let RichText: any = useRef();

    useEffect(() => {

        if (editQuestionNumber === 0) {
            setShowOptionFormulas([])
            setOptionEquations([])
        }

    }, [editQuestionNumber])

    const insertEquation = useCallback(() => {

        if (equation === "") {
            Alert('Equation cannot be empty.')
            return;
        }

        let currentContent = RichText.current.getContent();

        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";

        RichText.current.setContent(currentContent)

        // Update problem
        // const newProbs = [...problems];
        // newProbs[editQuestionNumber - 1].question = RichText.current.getContent();
        // setProblems(newProbs)
        // props.setProblems(newProbs)
        let audioVideoQuestion = problems[editQuestionNumber - 1].question[0] === "{" && problems[editQuestionNumber - 1].question[problems[editQuestionNumber - 1].question.length - 1] === "}";

        if (audioVideoQuestion) {
            const currQuestion = JSON.parse(problems[editQuestionNumber - 1].question);
            const updatedQuestion = {
                ...currQuestion,
                content: RichText.current.getContent()
            }
            const newProbs = [...problems];
            newProbs[editQuestionNumber - 1].question = JSON.stringify(updatedQuestion);
            setProblems(newProbs)
            props.setProblems(newProbs)

        } else {
            // setCue(modifedText);
            const newProbs = [...problems];
            newProbs[editQuestionNumber - 1].question = RichText.current.getContent();
            setProblems(newProbs)
            props.setProblems(newProbs)
        }

        // RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
        setShowEquationEditor(false);
        setEquation("");
        // setReloadEditorKey(Math.random())
    }, [equation, RichText, RichText.current, showEquationEditor, editQuestionNumber, problems]);

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

    const renderQuestionEditor = (index: number) => {

        if (editQuestionNumber === 0) return null;

        let audioVideoQuestion = problems[index].question[0] === "{" && problems[index].question[problems[index].question.length - 1] === "}";

        let url = "";
        let type = "";
        let content = "";

        if (audioVideoQuestion) {
            const parse = JSON.parse(problems[index].question);

            url = parse.url;
            content = parse.content;
            type = parse.type;
        }

        return (<View >
            {audioVideoQuestion || !showImportOptions ? null : (
                <View style={{ paddingVertical: 10 }}>
                    <FileUpload
                        action={"audio/video"}
                        back={() => setShowImportOptions(false)}
                        onUpload={(u: any, t: any) => {
                            const obj = { url: u, type: t, content: problems[index].question };
                            const newProbs = [...problems];
                            newProbs[index].question = JSON.stringify(obj);
                            setProblems(newProbs)
                            props.setProblems(newProbs)
                            setShowImportOptions(false);
                        }}
                    />
                </View>
            )}
            {audioVideoQuestion ?
                <View style={{ marginBottom: 20 }}>
                    {renderAudioVideoPlayer(url, type)}
                </View>
                : null
            }
            {/* {
                (showEquationEditor ?
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            borderColor: '#C1C9D2',
                            borderWidth: 1,
                            borderRadius: 15,
                            padding: 10,
                            width: '70%',
                            marginVertical: 20
                        }}>
                            <EquationEditor
                                value={equation}
                                onChange={setEquation}
                                autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                                autoOperatorNames="sin cos tan arccos arcsin arctan"
                            />
                        </View>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                paddingLeft: 20,
                                maxWidth: "10%",
                            }}
                            onPress={() => insertEquation()}
                        >
                            <Ionicons name="add-circle-outline" color="#16181C" size={15} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                paddingLeft: 10,
                                maxWidth: "10%",
                            }}
                            onPress={() => setShowFormulaGuide(true)}
                        >
                            <Ionicons name="help-circle-outline" color="#16181C" size={18} />
                        </TouchableOpacity>
                    </View> : null)
            } */}
            <FormulaGuide equation={equation} onChange={setEquation} show={showEquationEditor} onClose={() => setShowEquationEditor(false)} onInsertEquation={insertEquation}  />
            <Editor
                onInit={(evt, editor) => RichText.current = editor}
                initialValue={editQuestion && editQuestion.question ? editQuestion.question : ""}
                apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                init={{
                    skin: "snow",
                    // toolbar_sticky: true,
                    // selector: 'textarea',  // change this value according to your HTML
                    // content_style: 'div { margin: 10px; border: 5px solid red; padding: 3px; }',
                    indent: false,
                    body_class: 'tinyMCEInput',
                    branding: false,
                    placeholder: 'Problem',
                    autoresize_on_init: false,
                    autoresize_min_height: 250,
                    height: 250,
                    min_height: 250,
                    paste_data_images: true,
                    images_upload_url: 'https://api.cuesapp.co/api/imageUploadEditor',
                    mobile: {
                        plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                    },
                    plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                    menu: { // this is the complete default configuration
                        file: { title: 'File', items: 'newdocument' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                        insert: { title: 'Insert', items: 'link media | template hr' },
                        view: { title: 'View', items: 'visualaid' },
                        format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                        table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                        tools: { title: 'Tools', items: 'spellchecker code' }
                    },
                    // menubar: 'file edit view insert format tools table tc help',
                    menubar: false,
                    toolbar: 'undo redo | bold italic underline strikethrough | superscript subscript | numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons ',
                    importcss_append: true,
                    image_caption: true,
                    quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                    noneditable_noneditable_class: 'mceNonEditable',
                    toolbar_mode: 'sliding',
                    content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #a2a2ac;}",
                    // tinycomments_mode: 'embedded',
                    // content_style: '.mymention{ color: gray; }',
                    // contextmenu: 'link image table configurepermanentpen',
                    // a11y_advanced_options: true,
                    extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                    // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                    // content_css: useDarkMode ? 'dark' : 'default',
                }}
                onChange={(e: any) => {
                    if (audioVideoQuestion) {
                        const currQuestion = JSON.parse(problems[index].question);
                        const updatedQuestion = {
                            ...currQuestion,
                            content: e.target.getContent()
                        }
                        const newProbs = [...problems];
                        newProbs[index].question = JSON.stringify(updatedQuestion);
                        setProblems(newProbs)
                        props.setProblems(newProbs)

                    } else {
                        // setCue(modifedText);
                        const newProbs = [...problems];
                        newProbs[index].question = e.target.getContent();
                        setProblems(newProbs)
                        props.setProblems(newProbs)
                    }
                }}
            />
        </View>)
    }

    const cameraCallback = useCallback(async () => {
        const cameraSettings = await ImagePicker.getCameraPermissionsAsync();
        if (!cameraSettings.granted) {
            await ImagePicker.requestCameraPermissionsAsync();
            const updatedCameraSettings =
                await ImagePicker.getCameraPermissionsAsync();
            if (!updatedCameraSettings.granted) {
                return;
            }
        }
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true,
        });
        if (!result.cancelled) {
            RichText.current.insertImage(
                result.uri,
                "border-radius: 8px; max-width: 400px; width: 100%;"
            );
        }
    }, [RichText, RichText.current]);

    const galleryCallback = useCallback(async () => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync();
            const updatedGallerySettings =
                await ImagePicker.getMediaLibraryPermissionsAsync();
            if (!updatedGallerySettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true,
        });

        if (!result.cancelled) {
            RichText.current.insertImage(
                result.uri,
                "border-radius: 8px; max-width: 400px; width: 100%;"
            );
        }
    }, [RichText, RichText.current]);


    const optionGalleryCallback = useCallback(async (index: any, i: any) => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync()
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
            if (!updatedGallerySettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });

        if (!result.cancelled) {
            if (i !== null) {
                const newProbs = [...problems];
                newProbs[index].options[i].option = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            } else {
                const newProbs = [...problems];
                newProbs[index].question = "image:" + result.uri;
                setProblems(newProbs)
                props.setProblems(newProbs)
            }
        }
    }, [problems, props.setProblems])

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


    const addHeader = (index: number) => {

        // Use headers as an object with key as index values
        const currentHeaders = JSON.parse(JSON.stringify(headers));
        currentHeaders[index] = "";
        setHeaders(currentHeaders);
        props.setHeaders(currentHeaders);

    }

    const removeHeader = (index: number) => {

        const currentHeaders = JSON.parse(JSON.stringify(headers));
        delete currentHeaders[index];
        setHeaders(currentHeaders)
        props.setHeaders(currentHeaders);

    }

    const renderHeaderOption = (index: number) => {
        return <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }} >
            {index in headers
                ?
                <View style={{ flexDirection: 'row', width: '100%', marginTop: 50, marginBottom: 20 }}>
                    <View style={{ width: Dimensions.get('window').width < 1024 ? '95%' : '50%' }}>
                        <TextareaAutosize
                            style={{
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
                <TouchableOpacity
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
                            lineHeight: 35,
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            textTransform: 'uppercase',
                            width: 175,
                        }}
                    >
                        Add Heading
                    </Text>
                </TouchableOpacity>}
        </View>
    }

    const isCurrentQuestionValid = (index: number) => {

        if (editQuestionNumber === 0) return true;

        const currentQuestion = problems[index];

        if (currentQuestion.question === "") {
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

        return true;

    }



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



    // Create refs for current question options
    let optionRefs: any[] = []

    if (editQuestionNumber !== 0) {
        problems[editQuestionNumber - 1].options.map((_: any, index: number) => {
            optionRefs.push(getRef(index.toString()));
        })
    }

    return (
        <View style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            maxWidth: 900,
            borderTopRightRadius: 0,
            borderTopColor: '#efefef',
            borderTopWidth: 1,
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

                    // Audio/Video question

                    let audioVideoQuestion = problem.question[0] === "{" && problem.question[problem.question.length - 1] === "}";

                    let url = "";
                    let content = "";
                    let type = "";

                    if (audioVideoQuestion) {
                        const parse = JSON.parse(problem.question);

                        url = parse.url;
                        content = parse.content;
                        type = parse.type;
                    }


                    return <View style={{ borderBottomColor: '#C1C9D2', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25, width: '100%' }}>
                        {renderHeaderOption(index)}
                        <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 15 }}>
                            <View style={{ paddingTop: 15, flexDirection: 'row', flex: 1 }}>
                                <Text style={{ color: '#16181C', fontSize: 22, paddingBottom: 25, width: 40, paddingTop: 15, fontFamily: 'inter' }}>
                                    {index + 1}.
                                </Text>
                                <View style={{
                                    flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                                    alignItems: 'center',
                                    flex: 1,
                                    // width: '100%',
                                    maxWidth: 900,
                                    marginTop: Dimensions.get('window').width < 1024 ? 0 : 0
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        {editQuestionNumber === (index + 1) ? <View
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexDirection: 'row',
                                                marginBottom: Dimensions.get('window').width < 1024 ? 0 : 30,
                                            }}>
                                            <label style={{ width: 180, marginTop: 10 }}>
                                                <Select
                                                    touchUi={true}
                                                    cssClass="customDropdown"
                                                    value={dropdownQuestionType}
                                                    rows={questionTypeOptions.length}
                                                    data={questionTypeOptions}
                                                    themeVariant="light"
                                                    onChange={(val: any) => {
                                                        // setCustomCategory(val.value)
                                                        const updatedProblems = [...problems]
                                                        if (val.value === "mcq") {
                                                            updatedProblems[index].questionType = "";
                                                        } else {
                                                            updatedProblems[index].questionType = val.value;
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
                                        <DefaultTextInput
                                            value={editQuestionNumber === (index + 1) ? problem.points : ((problem.points === "" ? "Enter" : problem.points) + " " + (Number(problem.points) === 1 ? 'Point' : 'Points'))}
                                            editable={editQuestionNumber === (index + 1)}
                                            style={{
                                                fontSize: 14,
                                                padding: 15,
                                                paddingTop: 12,
                                                paddingBottom: 12,
                                                marginTop: 5,
                                                width: 120,
                                                marginLeft: editQuestionNumber === (index + 1) ? 20 : 0,
                                                textAlign: 'center',
                                                marginBottom: (Dimensions.get('window').width < 1024 || editQuestionNumber !== (index + 1)) ? 0 : 30,
                                                fontWeight: editQuestionNumber === (index + 1) ? 'normal' : '700',
                                                borderBottomColor: '#efefef',
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
                                    </View>
                                    {
                                        Dimensions.get('window').width < 1024 ? null : <View style={{ flex: 1 }} />
                                    }
                                    <View style={{ flexDirection: 'row' }}>
                                        {editQuestionNumber === (index + 1) ? <View style={{
                                            paddingRight: 20,
                                            paddingTop: 15, flexDirection: 'row', alignItems: 'center', marginBottom: (Dimensions.get('window').width < 1024 || editQuestionNumber !== (index + 1)) ? 0 : 30
                                        }}>
                                            <input
                                                style={{ paddingRight: 20 }}
                                                type='checkbox'
                                                checked={problem.required}
                                                onChange={(e) => {
                                                    const updatedProblems = [...problems]
                                                    updatedProblems[index].required = !updatedProblems[index].required;
                                                    setProblems(updatedProblems)
                                                    props.setProblems(updatedProblems)
                                                }}
                                            />
                                            <Text style={{ fontSize: 10, marginLeft: 10 }}>
                                                Required
                                            </Text>
                                        </View> : (!problem.required ?
                                            (<Text style={{ fontSize: 11, color: '#a2a2ac', marginTop: 5, marginBottom: 5, paddingTop: 8 }}>
                                                Optional
                                            </Text>)
                                            : (<Text style={{ fontSize: 11, color: '#a2a2ac', marginTop: 5, marginBottom: 5, paddingTop: 8 }}>
                                                Required
                                            </Text>))
                                        }
                                        <View style={{ paddingTop: 10, paddingLeft: editQuestionNumber === (index + 1) ? 0 : 25, flexDirection: 'row', alignItems: 'flex-end', marginBottom: (Dimensions.get('window').width < 1024 || editQuestionNumber !== (index + 1)) ? 0 : 30, }}>
                                            {editQuestionNumber === (index + 1) ?
                                                <View style={{ flexDirection: 'row', paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0 }}>
                                                    <Ionicons
                                                        name='save-outline'
                                                        color={"#006AFF"}
                                                        style={{
                                                            marginRight: 30
                                                        }}
                                                        onPress={() => {
                                                            if (isCurrentQuestionValid(editQuestionNumber - 1)) {
                                                                setEditQuestionNumber(0)
                                                                setEditQuestion({})
                                                            }
                                                        }}
                                                        size={23}
                                                    />

                                                    <Ionicons
                                                        name='trash-outline'
                                                        color={"#393939"}
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
                                                                    },
                                                                },
                                                            ])
                                                        }}
                                                        size={23}
                                                    />
                                                </View> : <Ionicons
                                                    name='pencil-outline'
                                                    color={'#006AFF'}
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
                                                            // 
                                                        }

                                                    }}
                                                    size={18}
                                                />}
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', width: '100%' }}>
                                <View key={reloadEditorKey} style={{ width: '100%', paddingTop: 7, paddingLeft: 40 }}>
                                    {(editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 10, justifyContent: 'flex-end' }}>
                                        {
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#fff'
                                                }}
                                                onPress={() => {
                                                    setShowEquationEditor(!showEquationEditor)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#006AFF',
                                                        fontFamily: 'Overpass',
                                                        fontSize: 10,
                                                        marginRight: 10
                                                    }}
                                                >                                                    
                                                    {PreferredLanguageText("formula")}
                                                </Text>
                                            </TouchableOpacity>
                                        }
                                        {/* {
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#fff'
                                                }}
                                                onPress={() => {

                                                    if (audioVideoQuestion) {
                                                        const updateProblems = lodash.cloneDeep(problems);
                                                        const question = updateProblems[index].question;
                                                        const parse = JSON.parse(question);
                                                        updateProblems[index].question = parse.content;
                                                        setProblems(updateProblems)
                                                        props.setProblems(updateProblems)

                                                    } else {
                                                        setShowImportOptions(!showImportOptions)
                                                    }

                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#006AFF',
                                                        fontFamily: 'Overpass',
                                                        fontSize: 10,
                                                        marginLeft: 20
                                                    }}
                                                >
                                                    {
                                                        showImportOptions ? "" : audioVideoQuestion ? "Clear" : "Media"
                                                    }
                                                </Text>
                                            </TouchableOpacity>
                                        } */}
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
                                            <FileUpload 
                                                quiz={true}
                                                action={"audio/video"}
                                                back={() => setShowImportOptions(false)}
                                                onUpload={(u: any, t: any) => {
                                                    const obj = { url: u, type: t, content: problems[index].question };
                                                    const newProbs = [...problems];
                                                    newProbs[index].question = JSON.stringify(obj);
                                                    setProblems(newProbs)
                                                    props.setProblems(newProbs)
                                                    setShowImportOptions(false);
                                                }}
                                            />
                                        }
                                    </View> : null)}
                                    {
                                        (editQuestionNumber === (index + 1) ? renderQuestionEditor(index) : (audioVideoQuestion ? <View style={{ }}>
                                            <View style={{ marginBottom: 20 }}>
                                                {renderAudioVideoPlayer(url, type)}
                                            </View>
                                            <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                {parser(content)}
                                            </Text>
                                        </View> : <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                            {parser(problem.question)}
                                        </Text>))
                                    }
                                </View>
                                {/* Add dropdown here */}
                            </View>
                        </View>
                        {
                            problem.questionType === "freeResponse" ? <Text style={{
                                marginTop: 20,
                                fontSize: 15,
                                marginLeft: 20,
                                paddingTop: 12,
                                paddingLeft: 40,
                                paddingBottom: 40,
                                width: '100%',
                                // maxWidth: Dimensions.get("window").width < 768 ? "100%" : "60%",
                                color: "#a2a2ac",
                                marginBottom: 20,
                                borderBottomColor: '#C1C9D2',
                                borderBottomWidth: 1
                            }}>
                                Free Response Answer
                            </Text> : null
                        }
                        {
                            problem.options.map((option: any, i: any) => {


                                return <View style={{ flexDirection: 'row', marginTop: 10, backgroundColor: 'none', width: '80%' }} >
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
                                    <View style={{ width: Dimensions.get('window').width < 1024 ? '100%' : '60%', paddingRight: 30, paddingBottom: 10 }}>
                                        {editQuestionNumber !== (index + 1) ? null : <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: 10 }}>
                                            {
                                                questionType === "trueFalse" ? null :
                                                    <TouchableOpacity
                                                        style={{ backgroundColor: '#fff' }}
                                                        onPress={() => {
                                                            const updateShowFormulas = [...showOptionFormulas]
                                                            updateShowFormulas[i] = !updateShowFormulas[i]
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
                                                            {PreferredLanguageText("formula")}
                                                        </Text>
                                                    </TouchableOpacity>
                                            }
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
                                        </View>}
                                        {
                                            <View style={{ width: '100%', marginBottom: 10 }}>
                                                {questionType === "trueFalse" || editQuestionNumber !== (index + 1) ?
                                                    <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                        {parser(option.option)}
                                                    </Text>
                                                    :
                                                    <View style={{ flexDirection: 'column' }}>
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
                                                        <Editor
                                                            onInit={(evt, editor) => {
                                                                const currRef: any = setRef(i.toString());
                                                                if (currRef) {
                                                                    currRef.current = editor
                                                                }

                                                            }}
                                                            initialValue={editQuestion && editQuestion.options && editQuestion.options[i] && editQuestion.options[i].option !== "" ? editQuestion.options[i].option : ""}
                                                            apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                                                            init={{
                                                                skin: "snow",
                                                                // toolbar_sticky: true,
                                                                branding: false,
                                                                placeholder: 'Option ' + (i + 1),
                                                                autoresize_on_init: false,
                                                                autoresize_min_height: 150,
                                                                height: 150,
                                                                min_height: 150,
                                                                paste_data_images: true,
                                                                images_upload_url: 'https://api.cuesapp.co/api/imageUploadEditor',
                                                                mobile: {
                                                                    plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                                                                },
                                                                plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                                                                menu: { // this is the complete default configuration
                                                                    file: { title: 'File', items: 'newdocument' },
                                                                    edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                                                                    insert: { title: 'Insert', items: 'link media | template hr' },
                                                                    view: { title: 'View', items: 'visualaid' },
                                                                    format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                                                                    table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                                                                    tools: { title: 'Tools', items: 'spellchecker code' }
                                                                },
                                                                // menubar: 'file edit view insert format tools table tc help',
                                                                menubar: false,
                                                                toolbar: 'undo redo | bold italic underline strikethrough | superscript subscript | numlist bullist removeformat | table image media link | charmap emoticons',
                                                                importcss_append: true,
                                                                image_caption: true,
                                                                quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                                                noneditable_noneditable_class: 'mceNonEditable',
                                                                toolbar_mode: 'sliding',
                                                                content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #a2a2ac;}",
                                                                // tinycomments_mode: 'embedded',
                                                                // content_style: '.mymention{ color: gray; }',
                                                                // contextmenu: 'link image table configurepermanentpen',
                                                                // a11y_advanced_options: true,
                                                                extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                                                                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                                                // content_css: useDarkMode ? 'dark' : 'default',
                                                            }}
                                                            onChange={(e: any) => {
                                                                const newProbs = [...problems];
                                                                newProbs[index].options[i].option = e.target.getContent();
                                                                setProblems(newProbs)
                                                                props.setProblems(newProbs)
                                                            }}
                                                        />

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
                                updatedProblems[index].options.push({
                                    option: '',
                                    isCorrect: false
                                })
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
                                // width: "100%",
                                // justifyContent: "center",
                                // flexDirection: "row",
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
                                    lineHeight: 35,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    height: 35,
                                    textTransform: 'uppercase',
                                    width: 175,
                                }}
                            >
                                Add Choice
                            </Text>
                        </TouchableOpacity> : <View style={{ height: 100 }} />}
                    </View>
                })
            }
            <View style={{
                width: '100%', flexDirection: 'row',
                justifyContent: 'center',
                // paddingLeft: 12,
                // paddingTop: 25,
                // borderBottomColor: '#C1C9D2',
                paddingBottom: 25, 
                // borderBottomWidth: 1
            }}>
                <TouchableOpacity
                    onPress={() => {

                        if (!isCurrentQuestionValid(editQuestionNumber - 1)) {
                            return;
                        }
                        const updatedProblems = [...problems, { question: '', options: [], points: '', questionType: '', required: true }]
                        setEditQuestionNumber(problems.length + 1)
                        setEditQuestion({ question: '', options: [] })
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
                            lineHeight: 35,
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
                        Add Problem
                    </Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

export default QuizCreate;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        borderBottomColor: '#efefef',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    picker: {
        display: "flex",
        justifyContent: "flex-start",
        backgroundColor: "white",
        overflow: "hidden",
        fontSize: 12,
        borderWidth: 1,
        width: 100,
        height: 20,
        marginTop: 10,
        borderRadius: 3
    }
});
