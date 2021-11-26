// REACT
import React, { useEffect, useState, useCallback, useRef, } from 'react';
import { Dimensions, TextInput as DefaultTextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TeXToSVG from "tex-to-svg";
import lodash from "lodash";
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
// import {
//     Menu,
//     MenuOptions,
//     MenuOption,
//     MenuTrigger,
// } from "react-native-popup-menu";

// HELPER
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleFile } from '../helpers/FileUpload';

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

        let currentContent = RichText.current.getContent();

        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";
        RichText.current.setContent(currentContent)

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
    }, [equation, RichText, RichText.current, showEquationEditor, editQuestionNumber, problems]);

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

    /**
     * @description Renders Question editor
     */
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
            {audioVideoQuestion ?
                <View style={{ marginBottom: 20 }}>
                    {renderAudioVideoPlayer(url, type)}
                </View>
                : null
            }
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
                        plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                    },
                    plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                    menu: { // this is the complete default configuration
                        file: { title: 'File', items: 'newdocument' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                        insert: { title: 'Insert', items: 'link media | template hr' },
                        view: { title: 'View', items: 'visualaid' },
                        format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                        table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                        tools: { title: 'Tools', items: 'spellchecker code' }
                    },
                    statusbar: false,
                    setup: (editor: any) => {
                                                                    
                        const equationIcon = '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>'
                        editor.ui.registry.addIcon('formula', equationIcon)
                        
                        editor.ui.registry.addButton("formula", {
                            icon: 'formula',
                            // text: "Upload File",
                            tooltip: 'Insert equation',
                            onAction: () => {
                                setShowEquationEditor(!showEquationEditor)
                            }
                        });

                        editor.ui.registry.addButton("upload", {
                            icon: 'upload',
                            tooltip: 'Import Audio/Video file',
                            onAction: async () => {

                                const res = await handleFile(true);

                                console.log("File upload result", res);

                                if (!res || res.url === "" || res.type === "") {
                                    return;
                                }

                                const obj = { url: res.url, type: res.type, content: problems[index].question };

                                const newProbs = [...problems];
                                newProbs[index].question = JSON.stringify(obj);
                                setProblems(newProbs)
                                props.setProblems(newProbs)
                              
                            }
                        })


                    },
                    // menubar: 'file edit view insert format tools table tc help',
                    menubar: false,
                    toolbar: 'undo redo | bold italic underline strikethrough | formula superscript subscript | numlist bullist | forecolor backcolor permanentpen removeformat | table image upload link media | charmap emoticons ',
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

    // Create refs for current question options
    let optionRefs: any[] = []

    if (editQuestionNumber !== 0) {
        problems[editQuestionNumber - 1].options.map((_: any, index: number) => {
            optionRefs.push(getRef(index.toString()));
        })
    }

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

                    if (audioVideoQuestion) {
                        const parse = JSON.parse(problem.question);

                        url = parse.url;
                        content = parse.content;
                        type = parse.type;
                    }


                    return <View style={{ borderBottomColor: '#efefef', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, paddingBottom: 25, width: '100%' }}>
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

                                        {editQuestionNumber === (index + 1) ? 
                                            <View
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                paddingTop: 15,
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
                                                        console.log("Change", val)
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
                                                paddingTop: 12,
                                                paddingBottom: 12,
                                                width: 120,
                                                marginLeft: editQuestionNumber === (index + 1) ? 20 : 0,
                                                textAlign: 'center',
                                                marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30,
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


                                        <View style={{ paddingTop: editQuestionNumber === (index + 1) ? 10 : 5, flexDirection: 'row', alignItems: 'flex-end', marginBottom: (Dimensions.get('window').width < 768 || editQuestionNumber !== (index + 1)) ? 0 : 30, }}>
                                            {editQuestionNumber === (index + 1) ?
                                                <View style={{ flexDirection: 'row', paddingLeft: 20 }}>

                                                    <Ionicons
                                                        name='trash-outline'
                                                        color={"#006aff"}
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
                                                    name='cog-outline'
                                                    color={'#006AFF'}
                                                    style={{
                                                        paddingTop: 4
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
                                                            // 
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
                            problem.options.map((option: any, i: any) => {


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
                                                    <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
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
                                                                    plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                                                                },
                                                                plugins: 'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                                                                menu: { // this is the complete default configuration
                                                                    file: { title: 'File', items: 'newdocument' },
                                                                    edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                                                                    insert: { title: 'Insert', items: 'link media | template hr' },
                                                                    view: { title: 'View', items: 'visualaid' },
                                                                    format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                                                                    table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                                                                    tools: { title: 'Tools', items: 'spellchecker code' }
                                                                },
                                                                statusbar: false,
                                                                setup: (editor: any) => {

                                                                    const equationIcon = '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>'
                                                                    editor.ui.registry.addIcon('formula', equationIcon)
                                                                    
                                                                    editor.ui.registry.addButton("formula", {
                                                                        icon: 'formula',
                                                                        // text: "Upload File",
                                                                        tooltip: 'Insert equation',
                                                                        onAction: () => {
                                                                            const updateShowFormulas = [...showOptionFormulas]
                                                                            updateShowFormulas[i] = !updateShowFormulas[i]
                                                                            setShowOptionFormulas(updateShowFormulas)
                                                                        }
                                                                    });


                                                                },
                                                                // menubar: 'file edit view insert format tools table tc help',
                                                                menubar: false,
                                                                toolbar: 'undo redo | bold italic underline strikethrough | formula superscript subscript | numlist bullist removeformat | table image media link | charmap emoticons',
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