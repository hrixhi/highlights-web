import EquationEditor from 'equation-editor-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
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


const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems, setProblems] = useState<any[]>(props.problems.slice())
    const [headers, setHeaders] = useState<any>(props.headers)
    const [instructions, setInstructions] = useState(props.instructions)
    const [solutions, setSolutions] = useState<any>([])
    const [updateKey, setUpdateKey] = useState(Math.random())
    const [shuffledProblems, setShuffledProblems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0,
      })

    const [editQuestionNumber, setEditQuestionNumber] = useState(0);
    const [modifiedCorrectAnswerProblems, setModifiedCorrectAnswerProblems] = useState<any[]>([]);
    const [regradeChoices, setRegradeChoices] = useState<any[]>([])
    const [timer, setTimer] = useState(false);
    const [height, setHeight] = useState(100);
    const [equation, setEquation] = useState("y = x + 1");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);

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

    }, [props.headers, props.instructions])

    // Over here the solutions objeect for modification is first set and updated based on changes...
    useEffect(() => {

        if (props.isOwner) return;

        if (props.solutions && props.solutions.length !== 0) {
            setSolutions(props.solutions)
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
          width: Dimensions.get('window').width < 768 ? "100%" : "50%",
          borderRightWidth: 0,
          flex: 1,
          paddingLeft: 0,
          borderColor: "#f4f4f6",
          paddingTop: 10,
          paddingRight: 25
        }}
      >
        <View
          style={{
            width: "100%",
            paddingBottom: 15,
            backgroundColor: "white",
            flexDirection: 'row',
            justifyContent: 'flex-start'
          }}
        >
          <Text style={{
            color: "#43434f",
            fontSize: 11,
            lineHeight: 30,
            // paddingRight: 20,
            paddingTop: 20,
            textTransform: "uppercase",
          }}>
            TIMED
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            width: "100%",
            height: 40,
            marginRight: 10,
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
            style={{ height: 20, marginRight: 20 }}
            trackColor={{
              false: "#f4f4f6",
              true: "#3B64F8",
            }}
            activeThumbColor="white"
          />
          {timer ? (
          <View
            style={{
              borderRightWidth: 0,
              paddingTop: 0,
              borderColor: "#f4f4f6",
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
                      fontFamily: "inter",
                      fontSize: 14,
                      color: "#43434f",
                    }}
                  >
                    {duration.hours} H <Ionicons name="caret-down" size={14} /> &nbsp;&nbsp;:&nbsp;&nbsp;
                  </Text>
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      padding: 10,
                      borderRadius: 15,
                      shadowOpacity: 0,
                      borderWidth: 1,
                      borderColor: "#f4f4f6",
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
                      fontFamily: "inter",
                      fontSize: 14,
                      color: "#43434f",
                    }}
                  >
                    {duration.minutes}  m  <Ionicons name="caret-down" size={14} />
                  </Text>
                </MenuTrigger>
                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      padding: 10,
                      borderRadius: 15,
                      shadowOpacity: 0,
                      borderWidth: 1,
                      borderColor: "#f4f4f6",
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


    useEffect(() => {

        // Determine if a problem has changed or is same as before
        const modified = problems.map((prob: any, index: number) => {

            // Only regrade MCQs and True and False
            if (prob.questionType === "" || prob.questionType === "trueFalse") {
                const options : any[] = prob.options;

                const unmodifiedOptions : any[] = props.unmodifiedProblems[index].options

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
                    fontSize: 15,
                    paddingTop: 12,
                    paddingBottom: 12,
                    maxWidth: "100%",
                    borderBottom: '1px solid #cccccc',
                    // fontWeight: "600",
                    width: Dimensions.get('window').width < 768 ? '100%' : '50%'
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
                    fontSize: 15,
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
        height={type === "mp3" || type === "wav" ? "75px" : "360px" }
        onContextMenu={(e: any) => e.preventDefault()}
        config={{
          file: { attributes: { controlsList: "nodownload" } },
        }}
      />
    }

    const insertEquation = useCallback(() => {
        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        RichText.current.insertHTML("<div>" + SVGEquation + "<br/></div>");
        setShowEquationEditor(false);
        setEquation("y = x + 1");
        // setReloadEditorKey(Math.random())
      }, [equation, RichText, RichText.current, showEquationEditor]);

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

        let audioVideoQuestion = problems[index].question[0] === "{"  && problems[index].question[problems[index].question.length - 1] === "}";

        let url = "";
        let type = "";
        let content = "";

        if (audioVideoQuestion) {
            const parse = JSON.parse(problems[index].question);

            url = parse.url;
            content = parse.content;
            type = parse.type;
        }
        
        return (<View style={{ width: '80%', marginBottom: 10 }} >
            <RichToolbar
                key={reloadEditorKey.toString()}
                style={{
                  flexWrap: "wrap",
                  backgroundColor: "white",
                  height: 28,
                  overflow: "visible",
                  alignItems: 'flex-start'
                }}
                iconSize={12}
                editor={RichText}
                disabled={false}
                iconTint={"#43434f"}
                selectedIconTint={"#43434f"}
                disabledIconTint={"#43434f"}
                actions={
                    [
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                    //   actions.checkboxList,
                      actions.insertLink,
                      actions.insertImage,
                      // "insertCamera",
                      actions.undo,
                      actions.redo,
                      "clear",
                    ]
                }
                iconMap={{
                  ["insertCamera"]: ({ tintColor }) => (
                    <Ionicons
                      name="camera-outline"
                      size={15}
                      color={tintColor}
                    />
                  ),
                  ["clear"]: ({ tintColor }) => (
                    <Ionicons
                      name="trash-outline"
                      size={13}
                      color={tintColor}
                    //   onPress={() => clearAll()}
                    />
                  ),
                }}
                onPressAddImage={galleryCallback}
                insertCamera={cameraCallback}
              />
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
                                props.setProblems(newProbs)
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                borderColor: '#f4f4f6',
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
                            <Ionicons name="add-circle-outline" color="#43434f" size={20} />
                        </TouchableOpacity>
                    </View> : null)
                }
                <RichEditor
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
                        borderColor: "#a2a2ac",
                    }}
                    editorStyle={{
                        backgroundColor: "#fff",
                        placeholderColor: "#a2a2ac",
                        color: "#43434f",
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
                />
        </View>)
    }



    const resetChanges = (questionNumber: number) => {

        const currentProblems = lodash.cloneDeep(problems)
        const unmodifiedProblems = lodash.cloneDeep(props.unmodifiedProblems)

        const updateProblems = currentProblems.map((problem: any, index: number) => {
            if (index === questionNumber){ 
                const unmodified : any = { ...unmodifiedProblems[index] }
                unmodified['problemIndex'] = index;
                return unmodified;
            }
            return problem;
        })

        setProblems([...updateProblems]);

        setEditQuestionNumber(0);
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

    if (problems.length !== solutions.length && !props.isOwner) {
        return null
    }

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
        <ActivityIndicator color={"#a2a2ac"} />
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
            {/* Show number of questions, Points, number of attempts here */}
            {/* {
                <View style={{ display: 'flex', flexDirection: 'row', }}>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                        {problems.length} {problems.length === 1 ? "Question" : "Questions"}
                    </Text>
                    <Text style={{ marginRight: 10, fontSize: 15}}>
                        |
                    </Text>
                    <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                        {totalPoints} Points 
                    </Text>
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontSize: 15}}>
                        |
                    </Text> : null}
                    {!props.isOwner && props.duration ? <Text style={{ marginRight: 10, fontWeight: '700' }}>
                        {duration.hours} H {duration.minutes} min
                    </Text> : null}

                    {!props.isOwner ? <Text style={{ marginRight: 10, fontSize: 15}}>
                        |
                    </Text> : null}
                    {!props.isOwner ? <Text style={{ marginRight: 10, fontWeight: '700' }}>
                        {props.remainingAttempts ? 'Remaining Attempts: ' + props.remainingAttempts : "Unlimited Attempts"}
                    </Text> : null}
                    
                </View>
            } */}
            {props.isOwner ? renderTimer() : null }
            {
                (props.isOwner ? 
                    <TextareaAutosize
                        value={instructions}
                        minRows={3}
                        style={{
                            marginTop: 20,
                            marginBottom: 20,
                            fontSize: 15,
                            paddingTop: 12,
                            paddingBottom: 12,
                            width: '100%',
                            maxWidth: "100%",
                            borderBottom: '1px solid #cccccc',
                        }}
                        onChange={(e: any) => setInstructions(e.target.value)}
                        placeholder={'Instructions'}
                    />
                :
                    (instructions !== "" ? <Text
                        style={{
                            marginTop: 20,
                            marginBottom: 20,
                            fontSize: 15,
                            paddingTop: 12,
                            paddingBottom: 12,
                            width: '100%',
                            lineHeight: 25
                        }}
                    >
                        {instructions}
                    </Text> : null))
            }
            
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

                    let audioVideoQuestion = problem.question[0] === "{"  && problem.question[problem.question.length - 1] === "}";

                    let url = "";
                    let content = "";
                    let type = "";

                    if (audioVideoQuestion) {
                        const parse = JSON.parse(problem.question);

                        url = parse.url;
                        content = parse.content;
                        type = parse.type;
                    }


                    return <View style={{ borderBottomColor: '#f4f4f6', borderBottomWidth: index === (problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        {props.isOwner && modifiedCorrectAnswerProblems[index] ? 
                            <View style={{ marginVertical: 10, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f3f3f3', borderRadius: 12 }}>
                                {regradeChoices[index] !== "" ? <Ionicons name='checkmark-circle-outline' size={22} color={'#53BE68'} /> : <Ionicons name='warning-outline' size={22} color={'#ED7D22'} />}
                                <Text style={{ paddingLeft: 10 }}>
                                    {regradeChoices[index] !== "" ? (regradeChoices[index] === "noRegrading" ? "Question will not be regraded" : "Question will be re-graded for all existing submissions") : "Correct Answer modified. Select regrade option for those who have already taken the quiz." }  
                                </Text>
                            </View>
                            : null }
                        <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row' }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <View style={{ paddingTop: 15 }}>
                                    <Text style={{ color: '#a2a2ac', fontSize: 15, paddingBottom: 25, marginRight: 10, paddingTop: 10 }}>
                                        {index + 1}.
                                    </Text>
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
                                                    // borderColor: '#f4f4f6',
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
                                                <View style={{ flexDirection: 'column', width: '100%' }}>
                                                    {renderQuestionEditor(editQuestionNumber - 1)}
                                                    {(editQuestionNumber === (index + 1) ? <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 20 }}>
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
                                                                        color: '#a2a2ac',
                                                                        fontFamily: 'Overpass',
                                                                        fontSize: 10
                                                                    }}
                                                                >
                                                                    {
                                                                        showEquationEditor ? "HIDE FORMULA" : "INSERT FORMULA"
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
                                                                        color: '#a2a2ac',
                                                                        fontFamily: 'Overpass',
                                                                        fontSize: 10,
                                                                        marginLeft: 20
                                                                    }}
                                                                >
                                                                    {
                                                                        showImportOptions ? "" : "INSERT AUDIO/VIDEO"
                                                                    }
                                                                </Text>
                                                            </TouchableOpacity>
                                                    }
                                                    </View> : null)}
                                                </View>
                                                : 
                                                (audioVideoQuestion ? <View style={{ width: '80%', marginBottom: 10 }}>
                                                    {renderAudioVideoPlayer(url, type)}
                                                    <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                        {parser(content)}
                                                    </Text>
                                                </View> : <Text style={{ marginVertical: 20, marginLeft: 20, fontSize: 15, width: '80%', marginBottom: 10, lineHeight: 25 }}>
                                                    {parser(problem.question)}
                                                </Text>))
                                    )
                                }

                            </View>
                            <View style={{ flexDirection: 'column', paddingTop: 15, marginBottom: Dimensions.get('window').width < 768 ? 30 : 0 }}>
                                <View
                                    style={{ flexDirection: 'row', height: 40, }}
                                >
                                    <TextInput
                                        editable={props.isOwner && editQuestionNumber === (index + 1)}
                                        value={props.isOwner && editQuestionNumber === (index + 1) ? problem.points : (problem.points + " " + (Number(problem.points) === 1 ? 'Point' : ' Points'))}
                                        style={{
                                            fontSize: 15,
                                            padding: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            marginTop: 5,
                                            marginBottom: 20,
                                            width: 150,
                                            maxHeight: 40,
                                            paddingLeft: Dimensions.get('window').width < 768 ? 40 : 0,
                                            fontWeight: props.isOwner && editQuestionNumber === (index + 1) ? 'normal' : '700',
                                            borderBottomColor: '#cccccc'
                                        }}
                                        onChangeText={(val) => {
                                            if (Number.isNaN(Number(val))) return;
                                            const newProbs = [...problems];
                                            newProbs[index].points = Number(val);
                                            setProblems(newProbs)
                                        }}
                                        placeholder={'Enter points'}
                                        placeholderTextColor={'#a2a2ac'}
                                    />
                                    {
                                        !problem.required ?
                                            (<Text style={{ fontSize: 11, color: '#a2a2ac', marginTop: 5, marginBottom: 20, paddingTop: 8 }}>
                                                optional
                                            </Text>)
                                            : (<Text style={{ fontSize: 11, color: '#a2a2ac', marginTop: 5, marginBottom: 20, paddingTop: 8 }}>
                                                required
                                            </Text>)
                                    }
                                    {
                                        props.isOwner ? (editQuestionNumber !== (index + 1) ? 
                                        (<TouchableOpacity onPress={() => setEditQuestionNumber(index + 1)} style={{ marginBottom: 20, paddingTop: 8, paddingLeft: 30, paddingRight: 5 }}> <Ionicons name='pencil-outline' size={25} color={'#3B64F8'} /></TouchableOpacity>) 
                                        : (<TouchableOpacity style={{ marginBottom: 20, paddingTop: 8, paddingLeft: 30, paddingRight: 5 }}> <View style={{ width: 22 }} /></TouchableOpacity>))
                                        :
                                        null
                                    }
                                </View>
                                {
                                    !problem.questionType && !onlyOneCorrect ?
                                        (<Text style={{ fontSize: 11, color: '#a2a2ac', marginTop: 5, marginBottom: 20, paddingRight: 30, paddingTop: 8, paddingLeft: Dimensions.get('window').width > 768 ? 0 : 40 }}>
                                            more than one correct answer
                                        </Text>)
                                        : null
                                }
                            </View>
                            
                        </View>

                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                let color = '#43434f'
                                if (props.isOwner && option.isCorrect) {
                                    color = '#3B64F8'
                                } 

                                return <View style={{ flexDirection: 'row' }} >
                                    <View style={{ paddingLeft: 40, paddingRight: 10 }}>
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
                                            style={{ paddingRight: 20, marginTop: 22 }}
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
                                                    ? <TextareaAutosize
                                                        value={option.option}
                                                        style={{
                                                            width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color,
                                                            borderBottom: '1px solid #cccccc',

                                                        }}
                                                        onChange={(e: any) => {
                                                            const newProbs = [...problems];
                                                            newProbs[problemIndex].options[i].option = e.target.value;
                                                            setProblems(newProbs)
                                                        }}
                                                        placeholder={'Option ' + (i + 1).toString()}
                                                    />
                                                    :
                                                    <Text
                                                        style={{
                                                            width: Dimensions.get('window').width < 768 ? '80%' : '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color,
                                                            lineHeight: 25
                                                        }}
                                                    >
                                                        {option.option}
                                                    </Text>)
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?

                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    {props.isOwner ? <Text style={{
                                            marginTop: 20,
                                            fontSize: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            width: '50%',
                                            maxWidth: "100%",
                                            color: props.isOwner ? "#a2a2ac" : "#000",
                                            marginBottom: props.isOwner ? 50 : 30
                                        }}>
                                        {props.isOwner ? "Free Response Answer" : solutions[problemIndex].response}
                                    </Text>: <TextareaAutosize 
                                        value={solutions[problemIndex].response}
                                        onChange={(e: any) => {
                                            const updatedSolution = [...solutions]
                                            updatedSolution[problemIndex].response = e.target.value;
                                            setSolutions(updatedSolution)
                                            props.setSolutions(updatedSolution)
                                        }}
                                        style={{
                                            marginTop: 20,
                                            marginBottom: 20,
                                            fontSize: 15,
                                            paddingTop: 12,
                                            paddingBottom: 12,
                                            width: '100%',
                                            maxWidth: "100%",
                                            borderBottom: '1px solid #cccccc',
                                        }}
                                        minRows={3}
                                        placeholder='Answer'
                                    />}

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
                                        <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#43434f', width: Dimensions.get('window').width > 768 ? '100%' : 200 }}>
                                            {regradeChoices[index] === '' ? 'Select Option' : regradeOptions[regradeChoices[index]]}<Ionicons name='caret-down' size={14} />
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
                                            width: Dimensions.get('window').width < 768 ? 300 : 400
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
                                        onPress={() => resetChanges(index) }
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120, marginRight: 30 }}
                                    >
                                            
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#43434f",
                                                fontSize: 12,
                                                backgroundColor: "#F4F4F6",
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
                                                fontFamily: "inter",
                                                overflow: "hidden",
                                                height: 35,
                                                textTransform: 'uppercase'
                                            }}>
                                            Reset
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setEditQuestionNumber(0) }
                                        style={{ backgroundColor: "white", borderRadius: 15, width: 120 }}
                                    >
                                            
                                        <Text
                                            style={{
                                                textAlign: "center",
                                                lineHeight: 35,
                                                color: "#43434f",
                                                fontSize: 12,
                                                backgroundColor: "#F4F4F6",
                                                borderRadius: 15,
                                                paddingHorizontal: 25,
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
                                props.modifyQuiz(instructions, problems, headers, modifiedCorrectAnswerProblems, regradeChoices, timer, duration);
                            }}
                            style={{ backgroundColor: "white", borderRadius: 15, width: 150 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#3B64F8",
                                    borderRadius: 15,
                                    paddingHorizontal: 25,
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
        // borderBottomColor: '#f4f4f6',
        // borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    }
});
