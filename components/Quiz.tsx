import EquationEditor from 'equation-editor-react';
import React, { useEffect, useState, useCallback, useRef, createRef } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions, Switch, Keyboard } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
import TextareaAutosize from 'react-textarea-autosize';
import { RadioButton } from './RadioButton';
import { Ionicons } from "@expo/vector-icons";
import lodash from "lodash";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

import TeXToSVG from "tex-to-svg";

import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import * as ImagePicker from 'expo-image-picker';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { WebView } from 'react-native-webview';
// import AutoHeightWebView from 'react-native-autoheight-webview'
import parser from 'html-react-parser';

import FileUpload from "./UploadFiles";

import ReactPlayer from "react-player";

import { Editor } from '@tinymce/tinymce-react';

import FormulaGuide from './FormulaGuide';

import useDynamicRefs from 'use-dynamic-refs';

const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems.slice())
    const [initialProblems, setInitialProblems] = useState<any[]>(lodash.cloneDeep(props.problems))
    const [headers, setHeaders] = useState<any>(props.headers)
    const [instructions, setInstructions] = useState(props.instructions)
    const [initialInstructions, setInitialInstructions] = useState(props.instructions)
    const [solutions, setSolutions] = useState<any>([])
    const [initialSolutions, setInitialSolutions] = useState<any>([])
    const [updateKey, setUpdateKey] = useState(Math.random())
    const [shuffledProblems, setShuffledProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0,
    })

    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [editQuestion, setEditQuestion] = useState<any>({});
    const [modifiedCorrectAnswerProblems, setModifiedCorrectAnswerProblems] = useState<any[]>([]);
    const [regradeChoices, setRegradeChoices] = useState<any[]>([])
    const [timer, setTimer] = useState(false);
    const [height, setHeight] = useState(100);
    const [equation, setEquation] = useState("");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(props.shuffleQuiz);
    const [problemRefs, setProblemRefs] = useState<any[]>(props.problems.map(() => createRef(null)));
    const [showFormulas, setShowFormulas] = useState<any[]>(props.problems.map((prob: any) => false));
    const [responseEquations, setResponseEquations] = useState<any[]>(props.problems.map((prob: any) => ""));
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);
    const [getRef, setRef] = useDynamicRefs();
    const [optionEquations, setOptionEquations] = useState<any[]>([]);
    const [showOptionFormulas, setShowOptionFormulas] = useState<any[]>([]);

    const regradeOptions = {
        'awardCorrectBoth': 'Award points for both corrected and previously correct answers (no scores will be reduced)',
        'onlyAwardPointsForNew': 'Only award points for new correct answer (some students\'\ scores may be deducted)',
        'giveEveryoneFullCredit': 'Give everyone full credit',
        'noRegrading': 'Update question without regrading.'
    }

    let RichText: any = useRef();

    useEffect(() => {

        setHeaders(props.headers);
        setInstructions(props.instructions);
        setInitialInstructions(props.instructions);

    }, [props.headers, props.instructions])

    useEffect(() => {
        setShuffleQuiz(props.shuffleQuiz)
    }, [props.shuffleQuiz])

    // Over here the solutions objeect for modification is first set and updated based on changes...
    useEffect(() => {

        if (props.isOwner) return;

        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions)

            // Load initial solutions for free-response text editors
            if (initialSolutions.length === 0) {
                setInitialSolutions(lodash.cloneDeep(props.solutions))
            }
        } else {
            const solutionInit: any = []
            problems.map((problem: any) => {

                if (!problem.questionType || problem.questionType === "trueFalse") {
                    const arr: any = []

                    problem.options.map((i: any) => {
                        arr.push({
                            options: i.option,
                            isSelected: false
                        })
                    })

                    solutionInit.push({
                        selected: arr
                    })
                } else {
                    solutionInit.push({
                        response: ''
                    })
                }


            })
            setSolutions(solutionInit)
            props.setSolutions(solutionInit)
        }
    }, [problems, props.solutions, props.setSolutions, props.isOwner])


    useEffect(() => {

        if (props.duration) {
            setTimer(true);

            let hours = Math.floor(props.duration / 3600);

            let minutes = Math.floor((props.duration - hours * 3600) / 60);

            setDuration({
                hours,
                minutes,
                seconds: 0
            });

        } else {
            setTimer(false);
        }

    }, [props.duration])

    useEffect(() => {
        if (props.shuffleQuiz && !props.isOwner) {
            setLoading(true)
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated
            })

            setProblems(updatedProblemsWithIndex)

            const headerPositions = Object.keys(headers);

            // Headers not at index 0
            const filteredHeaderPositions = headerPositions.filter((pos: any) => pos > 0);

            // If headers then we only shuffle the questions between each header
            if (filteredHeaderPositions.length > 0) {

                let arrayOfArrays = [];

                let start = 0;

                for (let i = 0; i <= filteredHeaderPositions.length; i++) {
                    if (i === filteredHeaderPositions.length) {
                        const subArray = updatedProblemsWithIndex.slice(start, updatedProblemsWithIndex.length);
                        arrayOfArrays.push(subArray);

                    } else {
                        const subArray = updatedProblemsWithIndex.slice(start, Number(filteredHeaderPositions[i]));
                        arrayOfArrays.push(subArray);
                        start = Number(filteredHeaderPositions[i]);

                    }

                }

                let shuffled: any = [];

                for (let i = 0; i < arrayOfArrays.length; i++) {
                    const s = shuffle(arrayOfArrays[i]);
                    shuffled.push(s);
                }

                const shuffledArray = shuffled.flat();

                setShuffledProblems(shuffledArray)


            } else {

                const shuffledArray = shuffle(updatedProblemsWithIndex);

                setShuffledProblems(shuffledArray)

            }

        } else {
            const updatedProblemsWithIndex = problems.map((prob: any, index: number) => {
                const updated = { ...prob, problemIndex: index };
                return updated
            })

            setProblems(updatedProblemsWithIndex)
        }
        setLoading(false)

    }, [props.shuffleQuiz, headers])

    const renderTimer = () => {

        const hours: any[] = [0, 1, 2, 3, 4, 5, 6]
        const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

        return <View
            style={{
                width: "100%",
                borderRightWidth: 0,
                flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                paddingTop: 20,
                borderColor: "#E3E8EE"
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    flex: 1,
                    paddingBottom: 15,
                    backgroundColor: "white"
                }}>
                <Text style={{
                    fontSize: 14,
                    fontFamily: 'inter',
                    color: '#1A2036'
                }}>Timed</Text>
            </View>
            <View
                style={{
                    backgroundColor: "white",
                    // width: "100%",
                    height: 40,
                    // marginRight: 10,
                    flexDirection: 'row',
                    justifyContent: 'flex-start'
                }}
            >
                <Switch
                    value={timer}
                    onValueChange={() => {
                        if (timer) {
                            setDuration({
                                hours: 1,
                                minutes: 0,
                                seconds: 0,
                            });
                        }
                        setTimer(!timer);
                    }}
                    style={{ height: 20 }}
                    trackColor={{
                        false: "#E3E8EE",
                        true: "#5469D4",
                    }}
                    activeThumbColor="white"
                />
                {timer ? (
                    <View
                        style={{
                            borderRightWidth: 0,
                            paddingTop: 0,
                            borderColor: "#E3E8EE",
                            flexDirection: 'row'
                        }}
                    >
                        <View>
                            <Menu onSelect={(hour: any) => setDuration({
                                ...duration,
                                hours: hour
                            })}>
                                <MenuTrigger>
                                    <Text
                                        style={{
                                            // fontFamily: "inter",
                                            fontSize: 14,
                                            color: "#1A2036",
                                        }}
                                    >
                                        {duration.hours} H <Ionicons name="chevron-down-outline" size={15} /> &nbsp;&nbsp;:&nbsp;&nbsp;
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions
                                    customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: "#E3E8EE",
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        },
                                    }}
                                >
                                    {hours.map((hour: any) => {
                                        return (
                                            <MenuOption value={hour}>
                                                <Text>{hour}</Text>
                                            </MenuOption>
                                        );
                                    })}
                                </MenuOptions>
                            </Menu>
                        </View>
                        <View>
                            <Menu onSelect={(min: any) => setDuration({
                                ...duration,
                                minutes: min
                            })}>
                                <MenuTrigger>
                                    <Text
                                        style={{
                                            // fontFamily: "inter",
                                            fontSize: 14,
                                            color: "#1A2036",
                                        }}
                                    >
                                        {duration.minutes}  m  <Ionicons name="chevron-down-outline" size={15} />
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions
                                    customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: "#E3E8EE",
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        },
                                    }}
                                >
                                    {minutes.map((min: any) => {
                                        return (
                                            <MenuOption value={min}>
                                                <Text>{min}</Text>
                                            </MenuOption>
                                        );
                                    })}
                                </MenuOptions>
                            </Menu>
                        </View>
                    </View>
                ) : null}
            </View>
        </View>
    }

    const renderShuffleQuizOption = () => {
        return (<View
            style={{
                width: "100%",
                borderRightWidth: 0,
                flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                paddingTop: 20,
                borderColor: "#E3E8EE"
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    flex: 1,
                    paddingBottom: 15,
                    backgroundColor: "white"
                }}>
                <Text style={{
                    fontSize: 14,
                    fontFamily: '#inter',
                    color: '#1A2036'
                }}>Random Order</Text>
            </View>
            <View
                style={{
                    backgroundColor: "white",
                    // width: "100%",
                    height: 40,
                    // marginRight: 10,
                    flexDirection: 'row',
                    justifyContent: 'flex-start'
                }}
            >
                <Switch
                    value={shuffleQuiz}
                    onValueChange={() => {
                        setShuffleQuiz(!shuffleQuiz);
                    }}
                    style={{ height: 20 }}
                    trackColor={{
                        false: "#E3E8EE",
                        true: "#5469D4",
                    }}
                    activeThumbColor="white"
                />
            </View>
        </View>)
    }


    useEffect(() => {

        // Determine if a problem has changed or is same as before
        const modified = problems.map((prob: any, index: number) => {

            // Only regrade MCQs and True and False
            if (prob.questionType === "" || prob.questionType === "trueFalse") {
                const options: any[] = prob.options;

                const unmodifiedOptions: any[] = props.unmodifiedProblems[index].options

                let modifiedCorrectAnswer = false;

                options.map((o: any, i: number) => {
                    if (o.isCorrect !== unmodifiedOptions[i].isCorrect) {
                        modifiedCorrectAnswer = true;
                    }
                })

                return modifiedCorrectAnswer
            }

            return false;
        })

        setModifiedCorrectAnswerProblems(modified)

    }, [problems])

    useEffect(() => {

        let initialModified = props.problems.map(() => false);
        let initialRegradeChoices = props.problems.map(() => '');

        setModifiedCorrectAnswerProblems(initialModified);
        setRegradeChoices(initialRegradeChoices);

    }, [props.problems])

    function shuffle(input: any[]) {

        const array = [...input];

        var currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }

    const renderHeader = (index: number) => {

        if (index in headers) {

            return props.isOwner ? (<TextareaAutosize
                value={headers[index]}
                style={{
                    marginBottom: 30,
                    marginTop: 50,
                    fontSize: 14,
                    paddingTop: 12,
                    paddingBottom: 12,
                    maxWidth: "100%",
                    borderRadius: 0,
                    borderBottom: '1px solid #E3E8EE',
                    // fontWeight: "600",
                    width: Dimensions.get('window').width < 1024 ? '100%' : '50%'
                }}
                onChange={(e: any) => {
                    const currentHeaders = JSON.parse(JSON.stringify(headers))
                    currentHeaders[index] = e.target.value
                    setHeaders(currentHeaders);
                }}
                placeholder={'Header'}
                minRows={1}
            />) : (<Text
                style={{
                    marginBottom: 30,
                    marginTop: 50,
                    fontSize: 14,
                    paddingTop: 12,
                    paddingBottom: 12,
                    fontWeight: "600",
                    width: '100%'
                }}
            >
                {headers[index]}
            </Text>)

        }

        return null;
    }

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h);
    }, []);

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

    const insertEquation = useCallback(() => {
        let currentContent = RichText.current.getContent();

        const SVGEquation = TeXToSVG(equation); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";

        RichText.current.setContent(currentContent)

        // Update the question
        // First fetch the question

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

        } else {
            // setCue(modifedText);
            const newProbs = [...problems];
            newProbs[editQuestionNumber - 1].question = RichText.current.getContent();
            setProblems(newProbs)
        }

        // RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
        setShowEquationEditor(false);
        setEquation("");

    }, [equation, RichText, RichText.current, showEquationEditor, problems, editQuestionNumber]);

    const insertResponseEquation = useCallback((problemIndex: number) => {
        let currentContent = problemRefs[problemIndex].current.getContent();

        const SVGEquation = TeXToSVG(responseEquations[problemIndex]); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";

        problemRefs[problemIndex].current.setContent(currentContent)

        // RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
        const updatedSolution = [...solutions]
        updatedSolution[problemIndex].response = problemRefs[problemIndex].current.getContent();
        setSolutions(updatedSolution)
        props.setSolutions(updatedSolution)

        const updateShowFormulas = [...showFormulas];
        updateShowFormulas[problemIndex] = false;
        setShowFormulas(updateShowFormulas);

        const updateResponseEquations = [...responseEquations];
        updateResponseEquations[problemIndex] = "";
        setResponseEquations(updateResponseEquations)

        // Problem 

        // setReloadEditorKey(Math.random())
    }, [showFormulas, problemRefs, responseEquations, solutions]);

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

        return (<View style={{ width: '100%', marginBottom: props.isOwner ? 0 : 10, paddingBottom: 20 }}>
            {audioVideoQuestion || !showImportOptions ? null : (
                <View style={{ paddingVertical: 10 }}>
                    <FileUpload
                        action={"audio/video"}
                        back={() => setShowImportOptions(false)}
                        onUpload={(u: any, t: any) => {
                            const obj = { url: u, type: t, content: '' };
                            const newProbs = [...problems];
                            newProbs[index].question = JSON.stringify(obj);
                            setProblems(newProbs)
                            setShowImportOptions(false);
                        }}
                    />
                </View>
            )}
            {audioVideoQuestion ?
                renderAudioVideoPlayer(url, type)
                : null
            }
            {
                (showEquationEditor ?
                    <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 400 }}>
                        <View style={{
                            borderColor: '#E3E8EE',
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
                                paddingHorizontal: 20,
                                maxWidth: "10%",
                            }}
                            onPress={() => insertEquation()}
                        >
                            <Ionicons name="add-circle-outline" color="#1A2036" size={15} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                paddingLeft: 10,
                                maxWidth: "10%",
                            }}
                            onPress={() => setShowFormulaGuide(true)}
                        >
                            <Ionicons name="help-circle-outline" color="#1A2036" size={20} />
                        </TouchableOpacity>
                    </View> : null)
            }
            {/* <RichEditor
                key={reloadEditorKey.toString()}
                containerStyle={{
                    height: 250,
                    backgroundColor: "#fff",
                    padding: 3,
                    paddingTop: 5,
                    paddingBottom: 10,
                    // borderRadius: 15,
                    display: "flex",
                }}
                ref={RichText}
                style={{
                    width: "100%",
                    backgroundColor: "#fff",
                    // borderRadius: 15,
                    minHeight: 250,
                    display: "flex",
                    borderBottomWidth: 1,
                    borderColor: "#50566B",
                }}
                editorStyle={{
                    backgroundColor: "#fff",
                    placeholderColor: "#50566B",
                    color: "#1A2036",
                    contentCSSText: "font-size: 14px;",
                }}
                initialContentHTML={audioVideoQuestion ? content : problems[index].question}
                onScroll={() => Keyboard.dismiss()}
                placeholder={"Problem"}
                onChange={(text) => {
                    if (audioVideoQuestion) {
                        const currQuestion = JSON.parse(problems[index].question);
                        const updatedQuestion = {
                            ...currQuestion,
                            content: text
                        }
                        const newProbs = [...problems];
                        newProbs[index].question = JSON.stringify(updatedQuestion);
                        setProblems(newProbs)
                        props.setProblems(newProbs)

                    } else {
                        const modifedText = text.split("&amp;").join("&");
                        // setCue(modifedText);
                        const newProbs = [...problems];
                        newProbs[index].question = modifedText;
                        setProblems(newProbs)
                        props.setProblems(newProbs)
                    }
                }}
                onHeightChange={handleHeightChange}
                onBlur={() => Keyboard.dismiss()}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                allowsLinkPreview={true}
                allowsBackForwardNavigationGestures={true}
            /> */}
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
                    autoresize_min_height: 350,
                    height: 350,
                    min_height: 350,
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
                    toolbar: 'undo redo | bold italic underline strikethrough |  numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                    importcss_append: true,
                    image_caption: true,
                    quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                    noneditable_noneditable_class: 'mceNonEditable',
                    toolbar_mode: 'sliding',
                    content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #50566B;}",
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

                    } else {
                        // setCue(modifedText);
                        const newProbs = [...problems];
                        newProbs[index].question = e.target.getContent();
                        setProblems(newProbs)
                    }
                }}
            />
        </View>)
    }



    const resetChanges = (questionNumber: number) => {

        const currentProblems = lodash.cloneDeep(problems)
        const unmodifiedProblems = lodash.cloneDeep(props.unmodifiedProblems)

        const updateProblems = currentProblems.map((problem: any, index: number) => {
            if (index === questionNumber) {
                const unmodified: any = { ...unmodifiedProblems[index] }
                unmodified['problemIndex'] = index;
                return unmodified;
            }
            return problem;
        })

        setProblems([...updateProblems]);

        setEditQuestionNumber(0);
        setEditQuestion({});
    }


    const selectMCQOption = (problem: any, problemIndex: number, optionIndex: number) => {

        if (props.isOwner) return;

        let onlyOneCorrect = true;

        if (!problem.questionType) {
            let noOfCorrect = 0;

            problem.options.map((option: any) => {
                if (option.isCorrect) noOfCorrect++;
            })

            if (noOfCorrect > 1) onlyOneCorrect = false;
        }
        // Check if one correct or multiple correct
        const updatedSolution = [...solutions]

        if (onlyOneCorrect && !updatedSolution[problemIndex].selected[optionIndex].isSelected) {
            problem.options.map((option: any, optionIndex: any) => {
                updatedSolution[problemIndex].selected[optionIndex].isSelected = false;
            })
        }

        updatedSolution[problemIndex].selected[optionIndex].isSelected = !updatedSolution[problemIndex].selected[optionIndex].isSelected;

        setSolutions(updatedSolution)
        props.setSolutions(updatedSolution)

    }

    const insertOptionEquation = (index: number) => {
        const ref: any = getRef(index.toString())

        if (!ref || !ref.current) return;

        let currentContent = ref.current.getContent();

        const SVGEquation = TeXToSVG(optionEquations[index], { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "</div>";

        ref.current.setContent(currentContent)

        // Update option
        const newProbs = [...problems];
        newProbs[editQuestionNumber - 1].options[index].option = ref.current.getContent();
        setProblems(newProbs)

        const updateShowFormulas = [...showOptionFormulas];
        updateShowFormulas[index] = false;
        setShowOptionFormulas(updateShowFormulas);

        const updateOptionEquations = [...optionEquations];
        updateOptionEquations[index] = "";
        setOptionEquations(updateOptionEquations)
    }

    let solutionRefs: any[] = []

    if (problems.length !== solutions.length && !props.isOwner) {
        return null
    }

    if (!props.isOwner && initialSolutions.length === 0) return null;

    problems.map((prob: any, index: number) => {
        solutionRefs.push(createRef(null));
    })

    let displayProblems = props.shuffleQuiz && !props.isOwner ? shuffledProblems : problems;

    let totalPoints = 0;

    problems.map((problem: any) => {
        totalPoints += Number(problem.points)
    })

    if (loading || props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#50566B"} />
    </View>)



    return (
        <View style={{
            width: '100%', backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}
        >
            {showFormulaGuide ? <FormulaGuide show={showFormulaGuide} onClose={() => setShowFormulaGuide(false)} /> : null}

            {/* Show number of questions, Points, number of attempts here */}
            {/* {
                <View style={{ display: 'flex', flexDirection: 'row', }}>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14 }}>
                        {problems.length} {problems.length === 1 ? "Question" : "Questions"}
                    </Text>
                    <Text style={{ marginRight: 10, fontSize: 14}}>
                        |
                    </Text>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14 }}>
                        {totalPoints} Points 
                    </Text>
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontSize: 14}}>
                        |
                    </Text> : null}
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontWeight: '700' }}>
                        {duration.hours} H {duration.minutes} min
                    </Text> : null}

                    {!props.isOwner ? <Text style={{ marginRight: 10, fontSize: 14}}>
                        |
                    </Text> : null}
                    {!props.isOwner ? <Text style={{ marginRight: 10, fontWeight: '700' }}>
                        {props.remainingAttempts ? 'Remaining Attempts: ' + props.remainingAttempts : "Unlimited Attempts"}
                    </Text> : null}
                    
                </View>
            } */}
            {props.isOwner ? renderTimer() : null}
            {props.isOwner ? renderShuffleQuizOption() : null}

            <View style={{ flexDirection: 'column', width: '100%', paddingBottom: 25, paddingTop: 15 }}>
                {/* <View
                    style={{
                        width: "100%",
                        paddingBottom: 15,
                        backgroundColor: "white",
                        flexDirection: 'row',
                        justifyContent: 'flex-start'
                    }}
                >
                    <Text style={{
                        color: "#1A2036",
                        fontSize: !props.isOwner ? 15 : 11,
                        fontWeight: !props.isOwner ? 'bold' : 'normal',
                        lineHeight: 35,
                        // paddingRight: 20,
                        paddingTop: !props.isOwner ? 50 : 20,
                        textTransform: "uppercase",
                    }}>
                        Instructions
                    </Text>
                </View> */}
                {
                    (props.isOwner ?
                        <Editor
                            // onInit={(evt, editor) => RichText.current = editor}
                            initialValue={initialInstructions}
                            apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                            init={{
                                skin: "snow",
                                // toolbar_sticky: true,
                                indent: false,
                                branding: false,
                                placeholder: 'Instructions',
                                autoresize_on_init: false,
                                autoresize_min_height: 350,
                                height: 350,
                                min_height: 350,
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
                                toolbar: 'undo redo | bold italic underline strikethrough |  numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                                importcss_append: true,
                                image_caption: true,
                                quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                noneditable_noneditable_class: 'mceNonEditable',
                                toolbar_mode: 'sliding',
                                content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #50566B;}",
                                // tinycomments_mode: 'embedded',
                                // content_style: '.mymention{ color: gray; }',
                                // contextmenu: 'link image table configurepermanentpen',
                                // a11y_advanced_options: true,
                                extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                // content_css: useDarkMode ? 'dark' : 'default',
                            }}
                            onChange={(e: any) => {
                                setInstructions(e.target.getContent())
                            }}
                        />
                        :
                        (instructions !== "" ? <Text
                            style={{
                                // marginTop: 20,
                                marginBottom: 20,
                                fontSize: 15,
                                paddingTop: 12,
                                paddingBottom: 12,
                                width: '100%',
                                lineHeight: 25
                            }}
                        >
                            {parser(instructions)}
                        </Text> : null))
                }

            </View>




            {
                displayProblems.map((problem: any, index: any) => {

                    const { problemIndex } = problem;

                    if (problemIndex === undefined || problemIndex === null) return;

                    let onlyOneCorrect = true;

                    if (!problem.questionType) {
                        let noOfCorrect = 0;

                        problem.options.map((option: any) => {
                            if (option.isCorrect) noOfCorrect++;
                        })

                        if (noOfCorrect > 1) onlyOneCorrect = false;
                    }

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


                    return <View style={{ borderBottomColor: '#f7fafc', width: '100%', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        {props.isOwner && modifiedCorrectAnswerProblems[index] ?
                            <View style={{ marginVertical: 10, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f3f3f3', borderRadius: 1 }}>
                                {regradeChoices[index] !== "" ? <Ionicons name='checkmark-circle-outline' size={22} color={'#53BE68'} /> : <Ionicons name='warning-outline' size={22} color={'#f3722c'} />}
                                <Text style={{ paddingLeft: 10 }}>
                                    {regradeChoices[index] !== "" ? (regradeChoices[index] === "noRegrading" ? "Question will not be regraded" : "Question will be re-graded for all existing submissions") : "Correct Answer modified. Select regrade option for those who have already taken the quiz."}
                                </Text>
                            </View>
                            : null}
                        <View style={{ width: '100%' }}>
                            <View style={{ width: '100%' }}>
                                <View style={{ paddingTop: 15, flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', width: '100%' }}>
                                    <Text style={{ color: '#1A2036', fontSize: 22, paddingBottom: 25, width: 40, paddingTop: 15, fontFamily: 'inter' }}>
                                        {index + 1}.
                                    </Text>
                                    <View style={{
                                        flexDirection: 'row',
                                        // paddingTop: 15,
                                        marginBottom: Dimensions.get('window').width < 1024 ? 30 : 0,
                                        flex: 1, justifyContent: 'flex-end'
                                    }}>
                                        <View
                                            style={{ flexDirection: 'row', height: 40, flex: 1 }}
                                        >
                                            <TextInput
                                                editable={props.isOwner && editQuestionNumber === (index + 1)}
                                                value={props.isOwner && editQuestionNumber === (index + 1) ? problem.points : (problem.points + " " + (Number(problem.points) === 1 ? 'Point' : ' Points'))}
                                                style={{
                                                    maxHeight: 40,
                                                    paddingLeft: 0,
                                                    fontWeight: props.isOwner && editQuestionNumber === (index + 1) ? 'normal' : '700',
                                                    borderBottomColor: '#E3E8EE',
                                                    fontSize: 14,
                                                    // padding: 15,
                                                    paddingTop: 12,
                                                    paddingBottom: 12,
                                                    marginTop: 5,
                                                    // width: 120,
                                                    // marginLeft: editQuestionNumber === (index + 1) ? 20 : 0,
                                                    textAlign: 'center',
                                                    marginBottom: (Dimensions.get('window').width < 1024 || editQuestionNumber !== (index + 1)) ? 0 : 30,
                                                    borderBottomWidth: editQuestionNumber === (index + 1) ? 1 : 0
                                                }}
                                                onChangeText={(val) => {
                                                    if (Number.isNaN(Number(val))) return;
                                                    const newProbs = [...problems];
                                                    newProbs[index].points = Number(val);
                                                    setProblems(newProbs)
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#50566B'}
                                            />
                                            {
                                                Dimensions.get('window').width < 1024 ? null : <View style={{ flex: 1 }} />
                                            }
                                            {
                                                !problem.required ?
                                                    (<Text style={{ fontSize: 11, color: '#50566B', marginTop: 5, marginBottom: 20, paddingTop: 8, textAlign: 'right' }}>
                                                        Optional
                                                    </Text>)
                                                    : (<Text style={{ fontSize: 11, color: '#50566B', marginTop: 5, marginBottom: 20, paddingTop: 8, textAlign: 'right' }}>
                                                        Required
                                                    </Text>)
                                            }
                                            {
                                                props.isOwner ? (editQuestionNumber !== (index + 1) ?
                                                    (<TouchableOpacity onPress={() => {
                                                        setEditQuestionNumber(index + 1)
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

                                                        const currProblemOptions: any[] = currentProblems[index].options;

                                                        const updateShowFormulas: any[] = [];

                                                        const updateOptionEquations: any[] = [];

                                                        currProblemOptions.map((option: any) => {
                                                            updateShowFormulas.push(false);
                                                            updateOptionEquations.push("")
                                                        })

                                                        setShowFormulas(updateShowFormulas)
                                                        setOptionEquations(updateOptionEquations)

                                                    }} style={{ marginBottom: 20, paddingTop: 8, paddingLeft: 30 }}> <Ionicons name='pencil-outline' size={17} color={'#5469D4'} /></TouchableOpacity>)
                                                    : (
                                                        null
                                                        // <TouchableOpacity style={{ marginBottom: 20, paddingTop: 8, paddingLeft: 30, paddingRight: 5 }}> <View style={{ width: 22 }} /></TouchableOpacity>
                                                    ))
                                                    :
                                                    null
                                            }
                                        </View>
                                        {
                                            !problem.questionType && !onlyOneCorrect ?
                                                (<Text style={{ fontSize: 11, color: '#50566B', marginTop: 5, marginBottom: 20, paddingRight: 30, paddingTop: 8, paddingLeft: Dimensions.get('window').width > 768 ? 0 : 40 }}>
                                                    more than one correct answer
                                                </Text>)
                                                : null
                                        }
                                    </View>

                                </View>
                                {
                                    problem.question && problem.question.includes("image:") ?
                                        (<Image
                                            resizeMode={'contain'}
                                            style={{
                                                width: 400,
                                                height: 400
                                            }}
                                            source={{
                                                uri: problem.question.split("image:")[1]
                                            }}
                                        />) :
                                        (
                                            problem.question && problem.question.includes("formula:") ? (
                                                <View style={{
                                                    // borderColor: '#E3E8EE',
                                                    // borderWidth: 1,
                                                    // borderRadius: 15,
                                                    padding: 10,
                                                    width: '80%'
                                                }}>
                                                    <EquationEditor
                                                        value={problem.question.split("formula:")[1]}
                                                        onChange={() => { setUpdateKey(Math.random()) }}
                                                        autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                                                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                    />
                                                </View>
                                            ) :
                                                (props.isOwner && editQuestionNumber === (index + 1) ?
                                                    <View style={{ flexDirection: 'column', width: '100%', paddingLeft: 40 }}>
                                                        {(editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 10, justifyContent: 'flex-end' }}>
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
                                                                            color: '#5469D4',
                                                                            fontFamily: 'Overpass',
                                                                            fontSize: 10
                                                                        }}
                                                                    >
                                                                        {
                                                                            showEquationEditor ? "Close" : "Equation"
                                                                        }
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            }
                                                            {
                                                                <TouchableOpacity
                                                                    style={{
                                                                        backgroundColor: '#fff'
                                                                    }}
                                                                    onPress={() => {
                                                                        setShowImportOptions(!showImportOptions)
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            color: '#5469D4',
                                                                            fontFamily: 'Overpass',
                                                                            fontSize: 10,
                                                                            marginLeft: 20
                                                                        }}
                                                                    >
                                                                        {
                                                                            showImportOptions ? "" : "Media"
                                                                        }
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            }
                                                        </View> : null)}
                                                        {renderQuestionEditor(editQuestionNumber - 1)}
                                                    </View>
                                                    :
                                                    (audioVideoQuestion ? <View style={{ width: '100%', marginBottom: 10 }}>
                                                        {renderAudioVideoPlayer(url, type)}
                                                        <Text style={{ marginVertical: 20, marginLeft: 40, fontSize: 14, lineHeight: 25 }}>
                                                            {parser(content)}
                                                        </Text>
                                                    </View> : <Text style={{ marginVertical: 20, paddingLeft: 40, fontSize: 14, width: '80%', marginBottom: 10, lineHeight: 25 }}>
                                                        {parser(problem.question)}
                                                    </Text>))
                                        )
                                }

                            </View>
                        </View>

                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                let color = '#1A2036'
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8'
                                }

                                return <View style={{ flexDirection: 'row', marginBottom: 20 }} >
                                    <View style={{ width: 40 }}>
                                        {onlyOneCorrect && editQuestionNumber !== (index + 1)
                                            ?
                                            <TouchableOpacity
                                                style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', marginTop: 21 }}
                                                onPress={() => {
                                                    selectMCQOption(problem, problemIndex, i);
                                                }}
                                                disabled={props.isOwner}
                                            >
                                                <RadioButton selected={props.isOwner ? option.isCorrect : solutions[problemIndex].selected[i].isSelected} />
                                            </TouchableOpacity>
                                            : <input
                                                disabled={props.isOwner && editQuestionNumber === (index + 1) ? false : props.isOwner}
                                                style={{ marginTop: 22 }}
                                                type='checkbox'
                                                // value={props.isOwner ? String(option.isCorrect) : String(solutions[index].selected[i].isSelected)}
                                                checked={props.isOwner ? option.isCorrect : solutions[problemIndex].selected[i].isSelected}
                                                onChange={(e: any) => {

                                                    if (props.isOwner) {
                                                        const updatedProbs = [...problems]
                                                        if (problem.questionType === "trueFalse") {
                                                            updatedProbs[problemIndex].options[0].isCorrect = false;
                                                            updatedProbs[problemIndex].options[1].isCorrect = false;
                                                        }
                                                        updatedProbs[problemIndex].options[i].isCorrect = !updatedProbs[problemIndex].options[i].isCorrect;
                                                        setProblems(updatedProbs)
                                                    } else {
                                                        selectMCQOption(problem, problemIndex, i);
                                                    }


                                                }}
                                            />}
                                    </View>
                                    {
                                        option.option && option.option.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 200,
                                                    height: 200
                                                }}
                                                source={{
                                                    uri: option.option.split("image:")[1]
                                                }}
                                            />) :
                                            (
                                                option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={() => { setUpdateKey(Math.random()) }}
                                                            autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    (props.isOwner && problem.questionType !== "trueFalse" && editQuestionNumber === (index + 1)
                                                        ?
                                                        <View style={{ flexDirection: 'column', maxWidth: 400 }}>
                                                            {!showOptionFormulas[i] ? null : <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 20 }}>
                                                                <View style={{
                                                                    borderColor: '#E3E8EE',
                                                                    borderWidth: 1,
                                                                    borderRadius: 15,
                                                                    padding: 10,
                                                                    width: Dimensions.get('window').width < 1024 ? '100%' : '50%'
                                                                }}>
                                                                    <EquationEditor
                                                                        value={optionEquations[i]}
                                                                        onChange={(eq) => {
                                                                            const updateOptionEquations = [...optionEquations]
                                                                            updateOptionEquations[i] = eq;
                                                                            setOptionEquations(updateOptionEquations)
                                                                        }}
                                                                        autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                                                                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                                    />
                                                                </View>
                                                                <TouchableOpacity
                                                                    style={{
                                                                        justifyContent: "center",
                                                                        paddingHorizontal: 20,
                                                                        maxWidth: "10%",
                                                                    }}
                                                                    onPress={() => insertOptionEquation(i)}
                                                                >
                                                                    <Ionicons name="add-circle-outline" color="#1A2036" size={20} />
                                                                </TouchableOpacity>
                                                                {/*  */}
                                                                <TouchableOpacity
                                                                    style={{
                                                                        justifyContent: "center",
                                                                        paddingLeft: 10,
                                                                        maxWidth: "10%",
                                                                    }}
                                                                    onPress={() => setShowFormulaGuide(true)}
                                                                >
                                                                    <Ionicons name="help-circle-outline" color="#1A2036" size={20} />
                                                                </TouchableOpacity>
                                                            </View>}
                                                            {editQuestionNumber !== (index + 1) ? null : <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 10 }}>
                                                                {
                                                                    problem.questionType === "trueFalse" ? null :
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
                                                                                    color: '#5469D4',
                                                                                    fontFamily: 'Overpass',
                                                                                    fontSize: 10
                                                                                }}
                                                                            >
                                                                                {
                                                                                    showOptionFormulas[i] ? "Close" : "Equation"
                                                                                }
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                }
                                                            </View>}
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
                                                                    // skin: "snow",
                                                                    // toolbar_sticky: true,
                                                                    branding: false,
                                                                    placeholder: 'Option',
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
                                                                    content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #50566B;}",
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
                                                                    newProbs[problemIndex].options[i].option = e.target.getContent();
                                                                    setProblems(newProbs)
                                                                }}
                                                            />
                                                        </View>
                                                        :
                                                        <Text
                                                            style={{
                                                                width: Dimensions.get('window').width < 1024 ? '80%' : '50%',
                                                                fontSize: 14,
                                                                padding: 15,
                                                                paddingTop: 12,
                                                                paddingBottom: 12,
                                                                marginTop: 5,
                                                                marginBottom: 20,
                                                                color,
                                                                lineHeight: 25
                                                            }}
                                                        >
                                                            {parser(option.option)}
                                                        </Text>)
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?

                                <View style={{
                                    width: '100%', paddingLeft: 40
                                }}>
                                    {props.isOwner ? <Text style={{
                                        marginTop: 20,
                                        fontSize: 14,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        // width: '50%',
                                        // maxWidth: "100%",
                                        color: props.isOwner ? "#50566B" : "#1A2036",
                                        marginBottom: props.isOwner ? 50 : 30
                                    }}>
                                        {props.isOwner ? "Free Response Answer" : solutions[problemIndex].response}
                                    </Text> :
                                        <View style={{ flexDirection: 'column', width: '100%' }}>
                                            {
                                                showFormulas[problemIndex]
                                                    ?
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 400 }}>
                                                        <View style={{
                                                            borderColor: '#E3E8EE',
                                                            borderWidth: 1,
                                                            borderRadius: 15,
                                                            padding: 10,
                                                            width: '70%',
                                                            marginVertical: 20
                                                        }}>
                                                            <EquationEditor
                                                                value={equation}
                                                                onChange={(x) => {
                                                                    const updateResponseEquations = [...responseEquations];
                                                                    updateResponseEquations[problemIndex] = x;
                                                                    setResponseEquations(updateResponseEquations)
                                                                }}
                                                                autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                                                                autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                            />
                                                        </View>
                                                        <TouchableOpacity
                                                            style={{
                                                                justifyContent: "center",
                                                                paddingHorizontal: 20,
                                                                maxWidth: "10%",
                                                            }}
                                                            onPress={() => insertResponseEquation(problemIndex)}
                                                        >
                                                            <Ionicons name="add-circle-outline" color="#1A2036" size={20} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={{
                                                                justifyContent: "center",
                                                                paddingLeft: 10,
                                                                maxWidth: "10%",
                                                            }}
                                                            onPress={() => setShowFormulaGuide(true)}
                                                        >
                                                            <Ionicons name="help-circle-outline" color="#1A2036" size={20} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    : null
                                            }
                                            <Editor
                                                onInit={(evt, editor) => {
                                                    const updateRefs = [...problemRefs];
                                                    updateRefs[problemIndex].current = editor
                                                    setProblemRefs(updateRefs)
                                                    solutionRefs[problemIndex].current = editor
                                                }}
                                                initialValue={initialSolutions[problemIndex].response}
                                                apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                                                init={{
                                                    skin: "snow",
                                                    // toolbar_sticky: true,
                                                    indent: false,
                                                    branding: false,
                                                    placeholder: 'Answer',
                                                    autoresize_on_init: false,
                                                    autoresize_min_height: 350,
                                                    height: 350,
                                                    min_height: 350,
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
                                                    toolbar: 'undo redo | bold italic underline strikethrough |  numlist bullist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                                                    importcss_append: true,
                                                    image_caption: true,
                                                    quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                                    noneditable_noneditable_class: 'mceNonEditable',
                                                    toolbar_mode: 'sliding',
                                                    content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #50566B;}",
                                                    // tinycomments_mode: 'embedded',
                                                    // content_style: '.mymention{ color: gray; }',
                                                    // contextmenu: 'link image table configurepermanentpen',
                                                    // a11y_advanced_options: true,
                                                    extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                                                    // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                                    // content_css: useDarkMode ? 'dark' : 'default',
                                                }}
                                                onChange={(e: any) => {
                                                    const updatedSolution = [...solutions]
                                                    updatedSolution[problemIndex].response = e.target.getContent();
                                                    setSolutions(updatedSolution)
                                                    props.setSolutions(updatedSolution)
                                                }}
                                            />
                                            <View style={{ paddingTop: 15, paddingBottom: 15 }}>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#fff'
                                                    }}
                                                    onPress={() => {
                                                        const updateShowFormulas = [...showFormulas]
                                                        updateShowFormulas[problemIndex] = !updateShowFormulas[problemIndex]
                                                        setShowFormulas(updateShowFormulas)
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#50566B',
                                                            fontFamily: 'Overpass',
                                                            fontSize: 10
                                                        }}
                                                    >
                                                        {
                                                            showFormulas[problemIndex] ? "HIDE FORMULA" : "INSERT FORMULA"
                                                        }
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        // <TextareaAutosize
                                        // value={solutions[problemIndex].response}
                                        // onChange={(e: any) => {
                                        //     const updatedSolution = [...solutions]
                                        //     updatedSolution[problemIndex].response = e.target.value;
                                        //     setSolutions(updatedSolution)
                                        //     props.setSolutions(updatedSolution)
                                        // }}
                                        // style={{
                                        //     marginTop: 20,
                                        //     marginBottom: 20,
                                        //     fontSize: 15,
                                        //     paddingTop: 12,
                                        //     paddingBottom: 12,
                                        //     width: '100%',
                                        //     maxWidth: "100%",
                                        //     borderBottom: '1px solid #E3E8EE',
                                        // }}
                                        // minRows={3}
                                        // placeholder='Answer'
                                        // />
                                    }


                                </View>
                                :
                                null

                        }

                        {/* Add save changes button & regrade options here */}

                        {
                            props.isOwner && modifiedCorrectAnswerProblems[index] && (editQuestionNumber !== index + 1) ?
                                <Text style={{ fontSize: 14, fontWeight: '800', paddingLeft: 20, marginBottom: 20 }}>
                                    {regradeChoices[index] === '' ? '' : regradeOptions[regradeChoices[index]]}
                                </Text>
                                : null
                        }

                        {
                            props.isOwner && modifiedCorrectAnswerProblems[index] && (editQuestionNumber === index + 1) ?
                                <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ marginRight: 10 }}>Regrade Option: </Text>
                                    <Menu
                                        onSelect={(cat: any) => {
                                            const updateRegradeChoices = [...regradeChoices];
                                            updateRegradeChoices[index] = cat;
                                            setRegradeChoices(updateRegradeChoices);
                                        }}>
                                        <MenuTrigger>
                                            <Text style={{ fontSize: 14, color: '#1A2036', width: Dimensions.get('window').width > 768 ? '100%' : 200 }}>
                                                {regradeChoices[index] === '' ? 'Select Option' : regradeOptions[regradeChoices[index]]}<Ionicons name='chevron-down-outline' size={15} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#b9b9b9',
                                                overflow: 'scroll',
                                                maxHeight: '100%',
                                                width: Dimensions.get('window').width < 1024 ? 300 : 400
                                            }
                                        }}>
                                            {
                                                Object.keys(regradeOptions).map((option: any, i: number) => {
                                                    return <MenuOption
                                                        value={option}>
                                                        <Text>
                                                            {i + 1}: {regradeOptions[option]}
                                                        </Text>
                                                    </MenuOption>
                                                })
                                            }
                                        </MenuOptions>
                                    </Menu>
                                </View>
                                :
                                null
                        }

                        {
                            props.isOwner && editQuestionNumber === (index + 1) ?
                                <View style={{ width: '100%', flexDirection: 'row', marginBottom: 30, marginLeft: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => resetChanges(index)}
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120, marginRight: 30 }}
                                    >

                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#1A2036",
                                                fontSize: 12,
                                                backgroundColor: "#f7fafc",
                                                borderRadius: 15,
                                                paddingHorizontal: 20,
                                                fontFamily: "inter",
                                                overflow: "hidden",
                                                height: 35,
                                                textTransform: 'uppercase'
                                            }}>
                                            Reset
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditQuestionNumber(0)
                                            setEditQuestion({})
                                        }}
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120 }}
                                    >

                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#1A2036",
                                                fontSize: 12,
                                                backgroundColor: "#f7fafc",
                                                borderRadius: 15,
                                                paddingHorizontal: 20,
                                                fontFamily: "inter",
                                                overflow: "hidden",
                                                height: 35,
                                                textTransform: 'uppercase'
                                            }}>
                                            DONE
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                :
                                null
                        }


                    </View>
                })


            }

            {/* Add Save Changes button here */}
            {
                props.isOwner ?
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                        <TouchableOpacity
                            onPress={() => {
                                props.modifyQuiz(instructions, problems, headers, modifiedCorrectAnswerProblems, regradeChoices, timer, duration, shuffleQuiz);
                            }}
                            style={{ backgroundColor: "white", borderRadius: 15, width: 150 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#5469D4",
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                Save
                            </Text>
                        </TouchableOpacity>
                    </View>
                    :
                    null
            }

        </View >
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f7fafc',
        // borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
