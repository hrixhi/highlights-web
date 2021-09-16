import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Keyboard,
  StyleSheet,
  Switch,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { TextInput as CustomTextInput } from "./CustomTextInput";
import { Text, View, TouchableOpacity } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { timedFrequencyOptions } from "../helpers/FrequencyOptions";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  createCue,
  createQuiz,
  getChannelCategories,
  getChannels,
  getSharedWith,
} from "../graphql/QueriesAndMutations";
import Datetime from "react-datetime";
import * as ImagePicker from "expo-image-picker";
import { DatePicker } from "rsuite";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import FileUpload from "./UploadFiles";
import Alert from "../components/Alert";
// import Select from 'react-select';
import QuizCreate from "./QuizCreate";
import DurationPicker from "react-duration-picker";
import TeXToSVG from "tex-to-svg";
import EquationEditor from "equation-editor-react";
// import WebView from 'react-native-webview';
import { PreferredLanguageText } from "../helpers/LanguageContext";
import moment from "moment";
import ReactPlayer from "react-player";
// import Webview from "./Webview";
import Multiselect from "multiselect-react-dropdown";
import WebViewer from '@pdftron/webviewer';


import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import TextareaAutosize from 'react-textarea-autosize';
import { Editor } from '@tinymce/tinymce-react';

const Create: React.FunctionComponent<{ [label: string]: any }> = (
  props: any
) => {
  const current = new Date();
  const [cue, setCue] = useState("");
  const [cueDraft, setCueDraft] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [starred, setStarred] = useState(false);
  const [notify, setNotify] = useState(false);
  const [color, setColor] = useState(0);
  const [frequency, setFrequency] = useState("0");
  const [customCategory, setCustomCategory] = useState("");
  const [localCustomCategories] = useState(props.customCategories);
  const [customCategories, setCustomCategories] = useState(
    props.customCategories
  );
  const [addCustomCategory, setAddCustomCategory] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [channelId, setChannelId] = useState<any>("");
  const [endPlayAt, setEndPlayAt] = useState(
    new Date(current.getTime() + 1000 * 60 * 60)
  );
  const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true);
  const colorChoices: any[] = [
    "#f94144",
    "#f3722c",
    "#f8961e",
    "#f9c74f",
    "#3abb83",
  ].reverse();
  const [modalAnimation] = useState(new Animated.Value(0));
  const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
  let RichText: any = useRef();
  let editorRef: any = useRef();

  const [height, setHeight] = useState(100);
  const [init, setInit] = useState(false);
  const [role, setRole] = useState('')
  const [submission, setSubmission] = useState(false);
  const [deadline, setDeadline] = useState(
    new Date(current.getTime() + 1000 * 60 * 60 * 24)
  );
  const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()));
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  // By default one day after deadline
  const [availableUntil, setAvailableUntil] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 48));

  const [gradeWeight, setGradeWeight] = useState<any>(0);
  const [graded, setGraded] = useState(false);
  const [imported, setImported] = useState(false);
  const [url, setUrl] = useState("");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [expandMenu, setExpandMenu] = useState(false);
  // options to create Quiz

  const [isQuiz, setIsQuiz] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [headers, setHeaders] = useState<any>({});
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [frequencyName, setFrequencyName] = useState("Day");

  const [timer, setTimer] = useState(false);
  const [duration, setDuration] = useState({
    hours: 1,
    minutes: 0,
    seconds: 0,
  });
  const [equation, setEquation] = useState("y = x + 1");
  const [showEquationEditor, setShowEquationEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shuffleQuiz, setShuffleQuiz] = useState(false);
  const [quizInstructions, setQuizInstructions] = useState("");
  const [initialDuration, setInitialDuration] = useState(null);

  const [channelName, setChannelName] = useState("");
  const [limitedShare, setLimitedShare] = useState(false);

  // Submission allowed attempts
  const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
  const [attempts, setAttempts] = useState("1");

  const window = Dimensions.get("window");
  const screen = Dimensions.get("screen");

  const [dimensions, setDimensions] = useState({ window, screen });
  // Alerts

  const enterOneProblemAlert = PreferredLanguageText("enterOneProblem");
  const invalidDurationAlert = PreferredLanguageText("invalidDuration");
  const fillMissingProblemsAlert = PreferredLanguageText("fillMissingProblems");
  const enterNumericPointsAlert = PreferredLanguageText("enterNumericPoints");
  // const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
  const fillMissingOptionsAlert = PreferredLanguageText("fillMissingOptions");
  const eachOptionOneCorrectAlert = PreferredLanguageText(
    "eachOptionOneCorrect"
  );
  const noStudentSelectedAlert = PreferredLanguageText("noStudentSelected");
  const selectWhoToShareAlert = PreferredLanguageText("selectWhoToShare");
  const clearQuestionAlert = PreferredLanguageText("clearQuestion");
  const cannotUndoAlert = PreferredLanguageText("cannotUndo");
  const somethingWentWrongAlert = PreferredLanguageText("somethingWentWrong");
  const checkConnectionAlert = PreferredLanguageText("checkConnection");
  const enterContentAlert = PreferredLanguageText("enterContent");
  const enterTitleAlert = PreferredLanguageText("enterTitle");

  const onChangeDuration = useCallback((duration: any) => {
    const { hours, minutes, seconds } = duration;
    setDuration({ hours, minutes, seconds });
  }, []);


  const onDimensionsChange = useCallback(({ window, screen }: any) => {
    setDimensions({ window, screen });
  }, []);
  useEffect(() => {
    Dimensions.addEventListener("change", onDimensionsChange);
    return () => {
      Dimensions.removeEventListener("change", onDimensionsChange);
    };
  }, []);

  const insertEquation = useCallback(() => {
    // 
    let currentContent = editorRef.current.getContent();

    const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
    currentContent += "<div>" + SVGEquation + "<br/></div>";

    editorRef.current.setContent(currentContent)

    // RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
    setShowEquationEditor(false);
    setEquation("");
    // setReloadEditorKey(Math.random())
  }, [equation, RichText, RichText.current, cue]);

  useEffect(() => {
    if (cue[0] === "{" && cue[cue.length - 1] === "}") {
      const obj = JSON.parse(cue);
      setImported(true);
      setUrl(obj.url);
      setType(obj.type);
      setTitle(obj.title);
    } else {
      setImported(false);
      setUrl("");
      setType("");
      setTitle("");
    }
  }, [cue]);

  useEffect(() => {
    if (url === '' || !url) {
      return
    }

    if (type === "mp4" ||
      type === "mp3" ||
      type === "mov" ||
      type === "mpeg" ||
      type === "mp2" ||
      type === "wav") {
      return;
    }

    console.log(url)
    WebViewer(
      {
        initialDoc: decodeURIComponent(url),
      },
      RichText.current,
    ).then((instance) => {
      const { documentViewer } = instance.Core;
      // you can now call WebViewer APIs here...
      documentViewer.addEventListener('documentLoaded', () => {
        // perform document operations
      });
    });
  }, [url, RichText, imported, type]);

  const createNewQuiz = useCallback(() => {
    setIsSubmitting(true);
    setCreatingQuiz(true);
    let error = false;
    if (problems.length === 0) {
      Alert(enterOneProblemAlert);
      return;
    }
    if (timer) {
      if (
        duration.hours === 0 &&
        duration.minutes === 0 &&
        duration.seconds === 0
      ) {
        Alert(invalidDurationAlert);
        return;
      }
    }
    problems.map((problem) => {
      if (problem.question === "" || problem.question === "formula:") {
        Alert(fillMissingProblemsAlert);
        error = true;
      }
      if (problem.points === "" || Number.isNaN(Number(problem.points))) {
        Alert(enterNumericPointsAlert);
        error = true;
      }
      let optionFound = false;
      // if (problem.options.length === 0) {
      //     Alert(mustHaveOneOptionAlert)
      //     error = true;
      // }

      // If MCQ then > 2 options
      if (!problem.questionType && problem.options.length < 2) {
        Alert("Problem must have at least 2 options");
        setIsSubmitting(false);
        error = true;
      }

      // If MCQ, check if any options repeat:
      if (!problem.questionType || problem.questionType === "trueFalse") {
        const keys: any = {};

        problem.options.map((option: any) => {
          if (option.option === "" || option.option === "formula:") {
            Alert(fillMissingOptionsAlert);
            setIsSubmitting(false);
            error = true;
          }

          if (option.option in keys) {
            Alert("Option repeated in a question");
            setIsSubmitting(false);
            error = true;
          }

          if (option.isCorrect) {
            optionFound = true;
          }

          keys[option.option] = 1;
        });

        if (!optionFound) {
          Alert(eachOptionOneCorrectAlert);
          setIsSubmitting(false);
          error = true;
        }
      }
    });
    if (error) {
      setIsSubmitting(false);
      setCreatingQuiz(false);
      return;
    }

    const server = fetchAPI("");
    const durationMinutes =
      duration.hours * 60 + duration.minutes + duration.seconds / 60;
    server
      .mutate({
        mutation: createQuiz,
        variables: {
          quiz: {
            problems,
            duration: timer ? durationMinutes.toString() : null,
            shuffleQuiz,
            instructions: quizInstructions,
            headers: JSON.stringify(headers),
          },
        },
      })
      .then((res) => {
        setCreatingQuiz(false);
        setIsSubmitting(false);
        if (res.data && res.data.quiz.createQuiz !== "error") {
          setCreatingQuiz(false);
          storeDraft("quizDraft", "");
          handleCreate(res.data.quiz.createQuiz);
        }
      });
  }, [
    problems,
    cue,
    modalAnimation,
    customCategory,
    props.saveDataInCloud,
    isQuiz,
    gradeWeight,
    deadline,
    initiateAt,
    submission,
    imported,
    selected,
    subscribers,
    shuffle,
    frequency,
    starred,
    color,
    notify,
    title,
    type,
    url,
    timer,
    duration,
    props.closeModal,
    channelId,
    endPlayAt,
    playChannelCueIndef,
    shuffleQuiz,
    quizInstructions,
    headers,
  ]);

  useEffect(() => {
    (async () => {
      const uString: any = await AsyncStorage.getItem("user");
      const userId = JSON.parse(uString);
      if (userId.role) {
        setRole(userId.role)
      }
    })()
  })

  const loadChannelCategoriesAndSubscribers = useCallback(async () => {
    const uString: any = await AsyncStorage.getItem("user");

    const userId = JSON.parse(uString);
    if (userId.role) {
      setRole(userId.role)
    }
    if (channelId === "") {
      setCustomCategories(localCustomCategories);
      return;
    }
    const server = fetchAPI("");
    // get categories
    server
      .query({
        query: getChannelCategories,
        variables: {
          channelId,
        },
      })
      .then((res) => {
        if (res.data.channel && res.data.channel.getChannelCategories) {
          setCustomCategories(res.data.channel.getChannelCategories);
        }
      })
      .catch((err) => { });
    // get subscribers
    server
      .query({
        query: getSharedWith,
        variables: {
          channelId,
          cueId: null,
        },
      })
      .then((res: any) => {
        if (res.data && res.data.cue.getSharedWith) {
          const subscribers: any[] = res.data.cue.getSharedWith;

          const format = subscribers.map((sub: any) => {
            return {
              id: sub.value,
              name: sub.label,
            };
          });

          const withoutOwner: any = [];
          format.map((i: any) => {
            if (userId._id !== i.id) {
              withoutOwner.push(i);
            }
          });
          setSubscribers(withoutOwner);
          // clear selected
          setSelected(withoutOwner);
        }
      })
      .catch((err: any) => console.log(err));
  }, [channelId, localCustomCategories]);

  useEffect(() => {
    loadChannelCategoriesAndSubscribers();
  }, [channelId]);

  const handleHeightChange = useCallback((h: any) => {
    setHeight(h);
  }, []);

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

  const loadChannels = useCallback(async () => {
    const uString: any = await AsyncStorage.getItem("user");
    if (uString) {
      const user = JSON.parse(uString);
      const server = fetchAPI("");
      server
        .query({
          query: getChannels,
          variables: {
            userId: user._id,
          },
        })
        .then((res) => {
          if (res.data.channel.findByUserId) {
            setChannels(res.data.channel.findByUserId);
          }
        })
        .catch((err) => { });
    }
    setInit(true);
  }, []);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (!init) {
      return;
    }
    let saveCue = "";
    if (imported) {
      const obj = {
        type,
        url,
        title,
      };
      saveCue = JSON.stringify(obj);
    } else if (isQuiz) {
      const quiz = {
        title,
        problems,
        timer,
        duration,
        headers,
        quizInstructions,
      };

      const saveQuiz = JSON.stringify(quiz);

      storeDraft("quizDraft", saveQuiz);
    } else {
      saveCue = cue;
    }
    if (saveCue && saveCue !== "") {
      storeDraft("cueDraft", saveCue);
    } else {
      storeDraft("cueDraft", "");
    }
  }, [
    cue,
    init,
    type,
    imported,
    url,
    title,
    problems,
    timer,
    duration,
    headers,
    quizInstructions,
  ]);

  const storeDraft = useCallback(async (type, value) => {
    await AsyncStorage.setItem(type, value);
  }, []);

  const handleCreate = useCallback(
    async (quizId?: string) => {
      setIsSubmitting(true);

      if (isSubmitting) return;

      if (!quizId && (cue === null || cue.toString().trim() === "")) {
        Alert(enterContentAlert);
        setIsSubmitting(false);
        return;
      }

      if ((imported || isQuiz) && title === "") {
        Alert(enterTitleAlert);
        setIsSubmitting(false);
        return;
      }

      if (submission && deadline < new Date()) {
        Alert("Submission deadline must be in future");
        setIsSubmitting(false);
        return;
      }

      let saveCue = "";
      if (quizId) {
        const obj: any = {
          quizId,
          title,
        };
        if (timer) {
          obj.initiatedAt = null;
        }
        saveCue = JSON.stringify(obj);
      } else if (imported) {
        const obj = {
          type,
          url,
          title,
        };
        saveCue = JSON.stringify(obj);
      } else {
        saveCue = cue;
      }

      // LOCAL CUE
      if (channelId === "") {
        let subCues: any = {};
        try {
          const value = await AsyncStorage.getItem("cues");
          if (value) {
            subCues = JSON.parse(value);
          }
        } catch (e) { }
        let _id = subCues["local"].length;
        while (true) {
          const duplicateId = subCues["local"].findIndex((item: any) => {
            return item._id === _id;
          });
          if (duplicateId === -1) {
            break;
          } else {
            _id++;
          }
        }
        subCues["local"].push({
          _id,
          cue: saveCue,
          date: new Date(),
          color,
          shuffle,
          frequency,
          starred,
          customCategory,
          endPlayAt:
            notify && (shuffle || !playChannelCueIndef)
              ? endPlayAt.toISOString()
              : "",
        });
        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        storeDraft("cueDraft", "");
        // setIsSubmitting(false)
        props.closeModal();
      } else {
        // CHANNEL CUE
        const uString = await AsyncStorage.getItem("user");
        if (!uString) {
          return;
        }
        const userName = await JSON.parse(uString)
        let ownerarray: any = selected
        const userSubscriptions = await AsyncStorage.getItem('subscriptions')
        if (userSubscriptions) {
          const list = JSON.parse(userSubscriptions)
          list.map((i: any) => {
            if (i.channelId === channelId) {
              ownerarray.push({
                id: i.channelCreatedBy,
                name: userName.fullName
              })
            }
          })
          setSelected(ownerarray)
        }


        // if (selected.length === 0) {
        //   Alert(noStudentSelectedAlert, selectWhoToShareAlert);
        //   setIsSubmitting(false);
        //   return;
        // }

        if ((submission || isQuiz) && deadline < initiateAt) {
          Alert("Available from time must be set before deadline", "");
          setIsSubmitting(false);
          return;
        }

        const user = JSON.parse(uString);
        const server = fetchAPI("");
        const userIds: any[] = [];
        if (selected.length !== 0) {
          selected.map((item) => {
            userIds.push(item.id);
          });
        }

        // If limited shares then need to add the person making the cue to the list of sharedWith (Filtered out from dropdown)
        userIds.push(user._id);

        const variables = {
          cue: saveCue,
          starred,
          color: color.toString(),
          channelId,
          frequency,
          customCategory,
          shuffle,
          createdBy: user._id,
          gradeWeight: gradeWeight.toString(),
          submission: submission || isQuiz,
          deadline: submission || isQuiz ? deadline.toISOString() : "",
          initiateAt: submission || isQuiz ? initiateAt.toISOString() : "",
          endPlayAt:
            notify && (shuffle || !playChannelCueIndef)
              ? endPlayAt.toISOString()
              : "",
          shareWithUserIds:
            !limitedShare ? null : userIds,
          limitedShares: limitedShare,
          allowedAttempts: attempts,
          availableUntil: (submission || isQuiz) && allowLateSubmission ? availableUntil.toISOString() : ""
        };

        server
          .mutate({
            mutation: createCue,
            variables,
          })
          .then((res) => {
            if (res.data.cue.create) {
              Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }).start(() => {
                storeDraft("cueDraft", "");
                setIsSubmitting(false);
                props.closeModal();
              });
            }
          })
          .catch((err) => {
            setIsSubmitting(false);
            Alert(somethingWentWrongAlert, checkConnectionAlert);
          });
      }
    },
    [
      cue,
      modalAnimation,
      customCategory,
      props.saveDataInCloud,
      isQuiz,
      timer,
      duration,
      gradeWeight,
      deadline,
      initiateAt,
      submission,
      imported,
      selected,
      subscribers,
      shuffle,
      frequency,
      starred,
      color,
      notify,
      title,
      type,
      url,
      props.closeModal,
      channelId,
      endPlayAt,
      playChannelCueIndef,
      allowLateSubmission,
      availableUntil
    ]
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const h = await AsyncStorage.getItem("cueDraft");
        if (h !== null) {
          setCue(h);
          setCueDraft(h);
        }
        const quizDraft = await AsyncStorage.getItem("quizDraft");
        if (quizDraft !== null) {
          const {
            duration,
            timer,
            problems,
            title,
            headers,
            quizInstructions,
          } = JSON.parse(quizDraft);
          setDuration(duration);
          setInitialDuration(duration);
          setTimer(timer);
          setProblems(problems);
          setTitle(title);
          setHeaders(headers);
          setQuizInstructions(quizInstructions);
        }
      } catch (e) {
        console.log(e);
      }
    };
    getData();
  }, []);

  const clearAll = useCallback(() => {
    Alert(clearQuestionAlert, cannotUndoAlert, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear",
        onPress: () => {
          setCue("");
          setImported(false);
          setUrl("");
          setType("");
          setTitle("");
          setProblems([]);
          setIsQuiz(false);
          setTimer(false);
          setShowEquationEditor(false);
          setEquation("");
          setReloadEditorKey(Math.random());
        },
      },
    ]);
  }, []);

  useEffect(() => {
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const onChange = useCallback(
    (value, { action, removedValue }) => {
      switch (action) {
        case "remove-value":
        case "pop-value":
          if (removedValue.isFixed) {
            return;
          }
          break;
        case "clear":
          value = subscribers.filter((v) => v.isFixed);
          break;
      }
      setSelected(value);
    },
    [subscribers]
  );

  const yesterday = moment().subtract(1, "day");
  const disablePastDt = (current: any) => {
    return current.isAfter(yesterday);
  };

  const quizAlert = PreferredLanguageText("quizzesCanOnly");
  const width = dimensions.window.width;

  const hours: any[] = [0, 1, 2, 3, 4, 5, 6]
  const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  const roundSeconds = (time: Date) => {
    console.log('value recieved', time)
    time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
    time.setSeconds(0, 0)
    console.log('value returning', time)
    return time
  }
  return (
    <ScrollView
      style={{
        width: "100%",
        height:
          dimensions.window.width < 1024
            ? dimensions.window.height - 30
            : dimensions.window.height,
        backgroundColor: "white",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: "scroll",
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          width: "100%",
          backgroundColor: "white",
          opacity: modalAnimation,
          height: "100%",
        }}
      >
        <Text
          style={{
            width: "100%",
            textAlign: "center",
            height: 15,
            paddingBottom: 30,
          }}
        >
          {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ backgroundColor: "white", flex: 1 }} />
          <TouchableOpacity
            onPress={() => setStarred(!starred)}
            style={{
              backgroundColor: "white",
            }}
          >
            <Text
              style={{
                textAlign: "right",
                lineHeight: 30,
                marginTop: -31,
                // paddingRight: 25,
                width: "100%",
              }}
            >
              <Ionicons
                name="bookmark"
                size={40}
                color={starred ? "#f94144" : "#818385"}
              />
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            width: "100%",
            display: "flex",
            flexDirection: dimensions.window.width < 1024 ? "column-reverse" : "row",
            paddingBottom: 4,
            marginTop: 0,
            backgroundColor: "white",
            borderBottomWidth: imported || isQuiz ? 0 : 1,
            borderBottomColor: '#F4F4F6'
          }}
          onTouchStart={() => Keyboard.dismiss()}
        >
          <View
            style={{
              flexDirection: dimensions.window.width < 1024 ? "column" : "row",
              flex: 1,
            }}
          >
            {/* {showImportOptions ? null : (
              <RichToolbar
                key={reloadEditorKey.toString()}
                style={{
                  flexWrap: "wrap",
                  backgroundColor: "white",
                  height: 28,
                  overflow: "visible",
                }}
                iconSize={12}
                editor={RichText}
                disabled={false}
                iconTint={"#1D1D20"}
                selectedIconTint={"#1D1D20"}
                disabledIconTint={"#1D1D20"}
                actions={
                  imported || isQuiz
                    ? [""]
                    : [
                      actions.setBold,
                      actions.setItalic,
                      actions.setUnderline,
                      actions.insertBulletsList,
                      actions.insertOrderedList,
                      actions.checkboxList,
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
                      onPress={() => clearAll()}
                    />
                  ),
                }}
                onPressAddImage={galleryCallback}
                insertCamera={cameraCallback}
              />
            )} */}
            {imported || !showImportOptions ? null : (
              <FileUpload
                back={() => setShowImportOptions(false)}
                onUpload={(u: any, t: any) => {
                  const obj = { url: u, type: t, title };
                  setCue(JSON.stringify(obj));
                  setShowImportOptions(false);
                }}
              />
            )}
          </View>
          <View style={{ flexDirection: "row" }}>
            {!isQuiz ? (
              <Text
                style={{
                  lineHeight: 30,
                  textAlign: "right",
                  paddingRight: 20,
                  textTransform: "uppercase",
                  fontSize: 15,
                  fontFamily: 'inter',
                  color: '#1D1D20',
                }}
                onPress={() => setShowEquationEditor(!showEquationEditor)}
              >
                {showEquationEditor
                  ? PreferredLanguageText("hide")
                  : PreferredLanguageText("formula")}
              </Text>
            ) : null}
            {isQuiz ? null : (
              <Text
                style={{
                  color: "#1D1D20",
                  lineHeight: 30,
                  textAlign: "right",
                  paddingRight: 20,
                  fontSize: 15,
                  fontFamily: 'inter',
                  textTransform: 'uppercase'
                }}
                onPress={() => setShowImportOptions(true)}
              >
                {PreferredLanguageText("import")}
              </Text>
            )}
            {
              role === 'instructor' ? <Text
                style={{
                  color: "#1D1D20",
                  lineHeight: 30,
                  textAlign: "right",
                  paddingRight: 10,
                  textTransform: "uppercase",
                  fontSize: 15,
                  fontFamily: 'inter',
                }}
                onPress={() => {
                  if (isQuiz) {
                    clearAll()
                    return
                  }
                  if (channelId !== "") {
                    setIsQuiz(true);
                    setSubmission(true);
                  } else {
                    Alert(quizAlert);
                  }
                }}
              >
                {isQuiz ? 'CANCEL' : PreferredLanguageText("quiz")}
              </Text> : null
            }
          </View>
        </View>
        {showEquationEditor ? (
          <View
            style={{
              width: "100%",
              flexDirection: width < 1024 ? "column" : "row",
              paddingBottom: 20,
            }}
          >
            <View
              style={{
                borderColor: "#e9e9ec",
                borderWidth: 1,
                borderRadius: 15,
                padding: 10,
                minWidth: 200,
                maxWidth: "50%",
              }}
            >
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
              <Ionicons name="add-circle-outline" color="#1D1D20" size={20} />
            </TouchableOpacity>
            <View
              style={{
                minWidth: "40%",
                flex: 1,
                paddingVertical: 5,
                justifyContent: "center",
              }}
            >
              <Text style={{ flex: 1, fontSize: 12, color: "#1D1D20", lineHeight: "1.5" }}>
                ^ → Superscript,  _ → Subscript,  int → Integral,  sum → Summation,  prod → Product,  sqrt → Square root,  bar → Bar over letter;  alpha, beta, ... omega → Small Greek letter;  Alpha, Beta, ... Omega → Capital Greek letter
              </Text>
            </View>
          </View>
        ) : null}
        <View
          style={{ paddingBottom: 100 }}
        // showsVerticalScrollIndicator={false}
        // scrollEnabled={true}
        // scrollEventThrottle={1}
        // keyboardDismissMode={"on-drag"}
        // overScrollMode={"always"}
        // nestedScrollEnabled={true}
        >
          {imported || isQuiz ? (
            <View
              style={{
                // display: "flex",
                flexDirection: width < 1024 ? "column" : "row",
                overflow: "visible",
              }}
            >
              <View
                style={{
                  width: width < 1024 ? "100%" : "50%",
                  maxWidth: 400,
                  borderRightWidth: 0,
                  borderColor: "#e9e9ec",
                  // paddingRight: 15,
                  // display: "flex",
                  paddingLeft: isQuiz && Dimensions.get('window').width > 768 ? 20 : 0,
                  flexDirection: "row",
                }}
              >
                <TextareaAutosize
                  value={title}
                  style={{
                    width: "100%",
                    maxWidth: '100%',
                    borderBottom: '1px solid #cccccc',
                    fontSize: 15,
                    paddingTop: 13,
                    paddingBottom: 13,
                    marginTop: 0,
                    marginBottom: 15
                  }}
                  // style={styles.input}
                  minRows={isQuiz ? 3 : 1}
                  placeholder={isQuiz ? "Quiz title" : PreferredLanguageText("title")}
                  onChange={(e: any) => setTitle(e.target.value)}
                />
                {
                  !isQuiz ?
                    <TouchableOpacity
                      style={{
                        marginLeft: 15,
                        paddingTop: 15,
                      }}
                      onPress={() => clearAll()}
                    >
                      <Ionicons
                        name="trash-outline"
                        color="#818385"
                        size={20}
                        style={{ alignSelf: "center" }}
                      />
                      <Text
                        style={{
                          fontSize: 9,
                          color: "#818385",
                          textAlign: "center",
                        }}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity> : null
                }
              </View>
              {isQuiz ? (
                <View
                  style={{
                    width: width < 1024 ? "100%" : "50%",
                    borderRightWidth: 0,
                    flex: 1,
                    paddingLeft: 20,
                    borderColor: "#e9e9ec",
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
                      fontSize: 15,
                      fontFamily: 'inter',
                      color: '#1D1D20'
                    }}>
                      Timed
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
                        false: "#F4F4F6",
                        true: "#007AFF",
                      }}
                      activeThumbColor="white"
                    />
                    {timer ? (
                      <View
                        style={{
                          borderRightWidth: 0,
                          paddingTop: 0,
                          borderColor: "#e9e9ec",
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
                                  color: "#1D1D20",
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
                                  borderColor: "#e9e9ec",
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
                                  color: "#1D1D20",
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
                                  borderColor: "#e9e9ec",
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
                        {/* <DurationPicker
                                                // key={Math.random()}
                                                onChange={(d) => onChangeDuration(d)}
                                                initialDuration={
                                                    initialDuration
                                                        ? initialDuration
                                                        : { hours: 1, minutes: 0, seconds: 0 }
                                                }
                                                // style={{ color: 'blue' }}
                                                maxHours={6}
                                            /> */}
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
          <View
            style={{
              width: "100%",
              minHeight: isQuiz ? 0 : 500,
              backgroundColor: "white",
            }}
          >
            {isQuiz ? (
              <View
                style={{
                  width: "100%",
                  flexDirection: "column",
                }}
              >
                <View style={{
                  backgroundColor: '#fff',
                  paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0,
                  flexDirection: 'row',
                  width: '100%'
                }}>
                  <View style={{ width: '100%', maxWidth: 400, paddingRight: Dimensions.get('window').width > 768 ? 15 : 0 }}>
                    <TextareaAutosize
                      value={quizInstructions}
                      placeholder="Instructions"
                      minRows={3}
                      style={{
                        width: "100%",
                        maxWidth: '100%',
                        borderBottom: '1px solid #cccccc',
                        fontSize: 15,
                        paddingTop: 13,
                        paddingBottom: 13,
                        marginTop: 0,
                        marginBottom: 5
                      }}
                      onChange={(e) => setQuizInstructions(e.target.value)}
                      required={false}
                    />
                  </View>
                </View>
                <QuizCreate
                  problems={problems}
                  headers={headers}
                  setProblems={(p: any) => setProblems(p)}
                  setHeaders={(h: any) => setHeaders(h)}
                />
              </View>
            ) : imported ? (
              type === "mp4" ||
                type === "mp3" ||
                type === "mov" ||
                type === "mpeg" ||
                type === "mp2" ||
                type === "wav" ? (
                <ReactPlayer
                  url={url}
                  controls={true}
                  onContextMenu={(e: any) => e.preventDefault()}
                  config={{
                    file: { attributes: { controlsList: "nodownload" } },
                  }}
                  width={'100%'}
                  height={'100%'}
                />
              ) : (
                <View key={url} style={{ flex: 1, maxHeight: 800 }}>
                  {/* <Webview key={url} url={url} /> */}
                  <div className="webviewer" ref={RichText} style={{ height: "100vh", borderWidth: 1, borderColor: '#e9e9ec', borderRadius: 1 }}></div>
                </View>
              )
            ) : null}
            {/* <RichEditor
              key={reloadEditorKey.toString()}
              containerStyle={{
                height,
                backgroundColor: "#fff",
                padding: 3,
                paddingTop: 5,
                paddingBottom: 10,
                // borderRadius: 15,
                display: isQuiz || imported ? "none" : "flex",
              }}
              ref={RichText}
              style={{
                width: "100%",
                backgroundColor: "#fff",
                // borderRadius: 15,
                minHeight: 550,
                display: isQuiz || imported ? "none" : "flex",
                // borderTopWidth: 0.5,
                // borderColor: "#818385",
              }}
              editorStyle={{
                backgroundColor: "#fff",
                placeholderColor: "#818385",
                color: "#1D1D20",
                contentCSSText: "font-size: 14px;",
              }}
              initialContentHTML={cue}
              onScroll={() => Keyboard.dismiss()}
              placeholder={PreferredLanguageText("title")}
              onChange={(text) => {
                const modifedText = text.split("&amp;").join("&");
                setCue(modifedText);
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
            {isQuiz || imported ? null : <Editor
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={cueDraft !== "" ? cueDraft : "<h1>Title</h1>"}
              apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
              init={{
                skin: "snow",
                // toolbar_sticky: true,
                branding: false,
                placeholder: 'Content...',
                min_height: 500,
                paste_data_images: true,
                images_upload_url: 'http://api.cuesapp.co/api/imageUploadEditor',
                mobile: {
                  plugins: 'print preview powerpaste casechange importcss searchreplace autolink autosave save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount tinymcespellchecker a11ychecker textpattern noneditable help formatpainter pageembed charmap mentions quickbars linkchecker emoticons advtable autoresize'
                },
                plugins: 'print preview powerpaste casechange importcss searchreplace autolink autosave save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount tinymcespellchecker a11ychecker textpattern noneditable help formatpainter pageembed charmap mentions quickbars linkchecker emoticons advtable autoresize',
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
                toolbar: 'undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat  pagebreak | table image media pageembed link | preview print | charmap emoticons |  ltr rtl | showcomments addcomment',
                importcss_append: true,
                image_caption: true,
                quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                noneditable_noneditable_class: 'mceNonEditable',
                toolbar_mode: 'sliding',
                // tinycomments_mode: 'embedded',
                // content_style: '.mymention{ color: gray; }',
                // contextmenu: 'link image table configurepermanentpen',
                // a11y_advanced_options: true,
                extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                // content_css: useDarkMode ? 'dark' : 'default',
              }}
              onChange={(e: any) => setCue(e.target.getContent())}

            />}
          </View>
          <View
            style={{
              width: '100%',
              display: "flex",
              flexDirection: "column",
              marginHorizontal: 10,
              maxWidth: 700, alignSelf: 'center',
              // marginLeft: width < 1024 ? 0 : 200
            }}
          >
            {channels.length !== 0 ? (
              <View
                style={{
                  display: "flex",
                  overflow: "visible",
                }}
              >
                <View
                  style={{
                    flexDirection: width < 1024 ? 'column' : "row",
                    borderRightWidth: 0,
                    borderColor: "#e9e9ec",
                    paddingTop: 40
                  }}
                >
                  <View
                    style={{
                      flex: 1, flexDirection: 'row',
                      paddingBottom: 15,
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20',
                        textTransform: 'uppercase'
                      }}
                    >
                      Share with
                    </Text>
                  </View>
                  <View
                    style={{
                      // display: "flex",
                      // flexDirection: "row",
                      backgroundColor: "white",
                    }}
                  >
                    <View
                      style={{
                        // width: "85%",
                        backgroundColor: "white",
                        display: "flex",
                      }}
                    >
                      <Menu
                        onSelect={(channel: any) => {
                          if (channel === "") {
                            setChannelId("");
                            setCustomCategories(localCustomCategories);
                            setCustomCategory("");
                            setAddCustomCategory(false);
                            setSubmission(false);
                            setGradeWeight(0);
                            setGraded(false);
                            setSelected([]);
                            setSubscribers([]);
                            setProblems([]);
                            setIsQuiz(false);
                            setChannelName("");
                            setTimer(false);
                          } else {
                            setChannelId(channel._id);
                            setChannelName(channel.name);
                            setAddCustomCategory(false);
                            setCustomCategory("");
                            setSubmission(isQuiz ? true : false);
                            setGradeWeight(0);
                            setGraded(false);
                          }
                        }}
                      >
                        <MenuTrigger>
                          <Text
                            style={{
                              fontFamily: "inter",
                              fontSize: 14,
                              color: "#1D1D20",
                            }}
                          >
                            {channelName === "" ? "My Cues" : channelName}
                            <Ionicons name="caret-down" size={14} />
                          </Text>
                        </MenuTrigger>
                        <MenuOptions
                          customStyles={{
                            optionsContainer: {
                              padding: 10,
                              borderRadius: 15,
                              shadowOpacity: 0,
                              borderWidth: 1,
                              borderColor: "#e9e9ec",
                              overflow: 'scroll',
                              maxHeight: '100%'
                            },
                          }}
                        >
                          <MenuOption value={""}>
                            <Text>{PreferredLanguageText("myCues")}</Text>
                          </MenuOption>
                          {channels.map((channel: any) => {
                            return (
                              <MenuOption value={channel}>
                                <Text>{channel.name}</Text>
                              </MenuOption>
                            );
                          })}
                        </MenuOptions>
                      </Menu>
                    </View>
                  </View>
                </View>

                {
                  channelId !== '' ? <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : "row", paddingTop: 40 }}>
                    <View
                      style={{
                        flex: 1, flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: "white",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'inter',
                          color: '#1D1D20',
                          textTransform: 'uppercase'
                        }}
                      >
                        SHARE WITH ALL
                      </Text>
                    </View>
                    <View>
                      <View
                        style={{
                          backgroundColor: "white",
                          height: 40,
                          marginRight: 10,
                          flexDirection: 'row',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Switch
                          value={!limitedShare}
                          onValueChange={() => {
                            setLimitedShare(!limitedShare);
                          }}
                          style={{ height: 20 }}
                          trackColor={{
                            false: "#F8F9FA",
                            true: "#818385",
                          }}
                          activeThumbColor="white"
                        />
                      </View>
                      {channelId !== "" && limitedShare ? (
                        <View
                          style={{
                            flexDirection: "column",
                            overflow: "scroll",
                          }}
                        >
                          <View style={{ width: "100%", padding: 5, height: "auto", maxWidth: 350 }}>
                            <Multiselect
                              placeholder="Share with..."
                              displayValue="name"
                              // key={userDropdownOptions.toString()}
                              // style={{ width: '100%', color: '#1D1D20',
                              //     optionContainer: { // To change css for option container
                              //         zIndex: 9999
                              //     }
                              // }}
                              options={subscribers} // Options to display in the dropdown
                              selectedValues={selected} // Preselected value to persist in dropdown
                              onSelect={(e, f) => {
                                console.log('on select values', e)
                                setSelected(e);
                                return true;
                              }} // Function will trigger on select event
                              onRemove={(e, f) => {
                                setSelected(e);
                                return true;
                              }}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>
                    : null
                }

                {channelId !== "" ? (
                  <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : "row", paddingTop: 40 }}>
                    <View
                      style={{
                        flex: 1, flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: "white",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'inter',
                          color: '#1D1D20',
                          textTransform: 'uppercase'
                        }}
                      >
                        {PreferredLanguageText("submissionRequired")}
                      </Text>
                    </View>
                    <View>
                      <View
                        style={{
                          backgroundColor: "white",
                          height: 40,
                          marginRight: 10,
                          flexDirection: 'row',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Switch
                          disabled={isQuiz}
                          value={submission}
                          onValueChange={() => {
                            setSubmission(!submission);
                          }}
                          style={{ height: 20 }}
                          trackColor={{
                            false: "#F4F4F6",
                            true: "#818385",
                          }}
                          activeThumbColor="white"
                        />
                      </View>
                      <View style={{ width: "100%", marginBottom: 15 }}>
                        <View style={{}}>
                          {submission ? (
                            <View
                              style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "white",
                                alignItems: 'center'
                              }}
                            >
                              <Text style={styles.text}>Available</Text>
                              <DatePicker
                                appearance={'subtle'}
                                format="YYYY-MM-DD HH:mm"
                                preventOverflow={true}
                                value={initiateAt}
                                onChange={(event: any) => {
                                  const date = new Date(event);
                                  const roundValue = roundSeconds(date)
                                  if (date < new Date()) return;
                                  setInitiateAt(roundValue);
                                }}
                                size={"xs"}
                              // isValidDate={disablePastDt}
                              />
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Add it here */}

                      <View style={{ width: "100%" }}>
                        <View style={{ flexDirection: "row" }}>
                          {submission ? (
                            <View
                              style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "white",
                                alignItems: 'center'
                                // marginLeft: 50,
                              }}
                            >
                              <Text style={styles.text}>
                                {PreferredLanguageText("deadline")}
                              </Text>
                              <DatePicker
                                format="YYYY-MM-DD HH:mm"
                                preventOverflow={true}
                                appearance={'subtle'}
                                value={deadline}
                                onChange={(event: any) => {
                                  const date = new Date(event);
                                  if (date < new Date()) return;
                                  const roundValue = roundSeconds(date)
                                  setDeadline(roundValue);
                                }}
                                size={"xs"}
                              // isValidDate={disablePastDt}
                              />
                            </View>
                          ) : null}
                        </View>

                        {/* Add it here */}
                      </View>
                    </View>
                  </View>
                ) : null}
                {submission ? (
                  <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                      style={{
                        flex: 1, flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: "white",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'inter',
                          color: '#1D1D20'
                        }}
                      >
                        GRADE WEIGHT
                      </Text>
                    </View>
                    <View>
                      <View>
                        <View
                          style={{
                            backgroundColor: "white",
                            height: 40,
                            marginRight: 10,
                            flexDirection: 'row',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Switch
                            value={graded}
                            onValueChange={() => setGraded(!graded)}
                            style={{ height: 20 }}
                            trackColor={{
                              false: "#F4F4F6",
                              true: "#818385",
                            }}
                            activeThumbColor="white"
                          />
                        </View>
                      </View>
                      <View>
                        {graded ? (
                          <View
                            style={{
                              // width: "100%",
                              // display: "flex",
                              flexDirection: 'row',
                              justifyContent: 'flex-end',
                              backgroundColor: "white",
                              // alignItems: 'center'
                            }}
                          >
                            <Text style={{
                              fontSize: 12,
                              color: "#818385",
                              textAlign: "left",
                              paddingHorizontal: 10,
                              paddingTop: 20
                            }}>
                              {PreferredLanguageText("percentageOverall")}
                            </Text>
                            <TextInput
                              value={gradeWeight}
                              style={{
                                width: "25%",
                                borderBottomColor: "#F4F4F6",
                                borderBottomWidth: 1,
                                fontSize: 15,
                                padding: 15,
                                paddingVertical: 12,
                                marginTop: 0,
                              }}
                              placeholder={"0-100"}
                              onChangeText={(val) => setGradeWeight(val)}
                              placeholderTextColor={"#818385"}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Late Submissions */}

                {submission ? (
                  <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                      style={{
                        flex: 1, flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: "white",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'inter',
                          color: '#1D1D20'
                        }}
                      >
                        LATE SUBMISSION
                      </Text>
                    </View>
                    <View>
                      <View>
                        <View
                          style={{
                            backgroundColor: "white",
                            height: 40,
                            marginRight: 10,
                            flexDirection: 'row',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Switch
                            value={allowLateSubmission}
                            onValueChange={() => setAllowLateSubmission(!allowLateSubmission)}
                            style={{ height: 20 }}
                            trackColor={{
                              false: "#F4F4F6",
                              true: "#818385",
                            }}
                            activeThumbColor="white"
                          />
                        </View>
                      </View>
                      <View>
                        {allowLateSubmission ? (
                          <View
                            style={{
                              width: "100%",
                              display: "flex",
                              flexDirection: "row",
                              backgroundColor: "white",
                              alignItems: 'center'
                              // marginLeft: 50,
                            }}
                          >
                            <Text style={styles.text}>
                              Available Until
                            </Text>
                            <DatePicker
                              format="YYYY-MM-DD HH:mm"
                              preventOverflow={true}
                              appearance={'subtle'}
                              value={availableUntil}
                              onChange={(event: any) => {
                                const date = new Date(event);
                                if (date < deadline) return;
                                const roundValue = roundSeconds(date)
                                setAvailableUntil(roundValue);
                              }}
                              size={"xs"}
                            // isValidDate={disablePastDt}
                            />
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Allowed attempts */}

                {submission && isQuiz ? (
                  <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                      style={{
                        flex: 1, flexDirection: 'row',
                        backgroundColor: "white",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'inter',
                          color: '#2f2f3c',
                          textTransform: 'uppercase'

                        }}
                      >
                        Unlimited Attempts
                      </Text>
                    </View>
                    <View>
                      <View
                        style={{
                          backgroundColor: "white",
                          height: 40,
                          marginRight: 10,
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Switch
                          value={unlimitedAttempts}
                          onValueChange={() => {
                            if (!unlimitedAttempts) {
                              setAttempts("")
                            } else {
                              setAttempts('1')
                            }
                            setUnlimitedAttempts(!unlimitedAttempts)
                          }}
                          style={{ height: 20 }}
                          trackColor={{
                            false: "#F8F9FA",
                            true: "#818385",
                          }}
                          activeThumbColor="white"
                        />
                      </View>
                      {!unlimitedAttempts ? (
                        <View
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            backgroundColor: "white",
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={styles.text}>
                            Allowed attempts
                          </Text>
                          <TextInput
                            value={attempts}
                            style={{
                              width: "25%",
                              borderBottomColor: "#F8F9FA",
                              borderBottomWidth: 1,
                              fontSize: 15,
                              padding: 15,
                              paddingVertical: 12,
                              marginTop: 0,
                            }}
                            placeholder={""}
                            onChangeText={(val) => {
                              if (Number.isNaN(Number(val))) return;
                              setAttempts(val)
                            }}
                            placeholderTextColor={"#818385"}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View
              style={{
                display: "flex",
              }}
            >
              <View
                style={{
                  width: "100%",
                  borderRightWidth: 0,
                  borderColor: "#e9e9ec",
                }}
              >
                <View style={{ width: "100%", backgroundColor: "white", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                  <View
                    style={{
                      flex: 1, flexDirection: 'row',
                      paddingBottom: 15,
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20',
                        textTransform: 'uppercase'

                      }}
                    >
                      {PreferredLanguageText("category")}
                    </Text>
                  </View>
                  <View
                    style={{
                      // width: "100%",
                      // display: "flex",
                      flexDirection: "row",
                      backgroundColor: "white",
                    }}
                  >
                    <View style={{ width: "85%", backgroundColor: "white" }}>
                      {addCustomCategory ? (
                        <View style={styles.colorBar}>
                          <TextInput
                            value={customCategory}
                            style={styles.allGrayOutline}
                            placeholder={"Enter Category"}
                            onChangeText={(val) => {
                              setCustomCategory(val);
                            }}
                            placeholderTextColor={"#818385"}
                          />
                        </View>
                      ) : (
                        <Menu onSelect={(cat: any) => setCustomCategory(cat)}>
                          <MenuTrigger>
                            <Text
                              style={{
                                fontFamily: "inter",
                                fontSize: 14,
                                color: "#1D1D20",
                              }}
                            >
                              {customCategory === "" ? "None" : customCategory}
                              <Ionicons name="caret-down" size={14} />
                            </Text>
                          </MenuTrigger>
                          <MenuOptions
                            customStyles={{
                              optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: "#e9e9ec",
                                overflow: 'scroll',
                                maxHeight: '100%'
                              },
                            }}
                          >
                            <MenuOption value={""}>
                              <Text>None</Text>
                            </MenuOption>
                            {customCategories.map((category: any) => {
                              return (
                                <MenuOption value={category}>
                                  <Text>{category}</Text>
                                </MenuOption>
                              );
                            })}
                          </MenuOptions>
                        </Menu>
                      )}
                    </View>
                    <View style={{ width: "15%", backgroundColor: "white" }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (addCustomCategory) {
                            setCustomCategory("");
                            setAddCustomCategory(false);
                          } else {
                            setCustomCategory("");
                            setAddCustomCategory(true);
                          }
                        }}
                        style={{ backgroundColor: "white" }}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            lineHeight: 20,
                            width: "100%",
                          }}
                        >
                          <Ionicons
                            name={addCustomCategory ? "close" : "add"}
                            size={20}
                            color={"#1D1D20"}
                          />
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
              <View
                style={{
                  width: "100%",
                  borderRightWidth: 0,
                  borderColor: "#e9e9ec",
                  flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40
                }}
              >
                <View
                  style={{
                    flex: 1, flexDirection: 'row',
                    paddingBottom: 15,
                    backgroundColor: "white",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'inter',
                      textTransform: 'uppercase',
                      color: '#1D1D20'
                    }}
                  >
                    {PreferredLanguageText("priority")}
                  </Text>
                </View>
                <View
                  style={{
                    // width: "100%",
                    // display: "flex",
                    flexDirection: "row",
                    backgroundColor: "white",
                  }}
                >
                  <View style={{ width: "100%", backgroundColor: "white" }}>
                    <ScrollView
                      style={{ ...styles.colorBar, height: 20 }}
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                    >
                      {colorChoices.map((c: string, i: number) => {
                        return (
                          <View
                            style={
                              color === i
                                ? styles.colorContainerOutline
                                : styles.colorContainer
                            }
                            key={Math.random()}
                          >
                            <TouchableOpacity
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: colorChoices[i],
                              }}
                              onPress={() => {
                                setColor(i);
                              }}
                            />
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
            <View
              style={{
                width: "100%",
                // paddingTop: 15,
                flexDirection: "column",
              }}
            >
              <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                  style={{
                    flex: 1, flexDirection: 'row',
                    paddingBottom: 15,
                    backgroundColor: "white",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'inter',
                      color: '#1D1D20',
                      textTransform: 'uppercase'
                    }}
                  >
                    Reminder
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "white",
                    //  width: "100%",
                    height: 40,
                    marginRight: 10,
                  }}
                >
                  <Switch
                    value={notify}
                    onValueChange={() => {
                      if (notify) {
                        // setShuffle(false)
                        setFrequency("0");
                      } else {
                        // setShuffle(true)
                        setFrequency("1-D");
                      }
                      setPlayChannelCueIndef(true);
                      setNotify(!notify);
                    }}
                    style={{ height: 20 }}
                    trackColor={{
                      false: "#F4F4F6",
                      true: "#007AFF",
                    }}
                    activeThumbColor="white"
                  />
                </View>
              </View>
              {notify ? (
                <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                  <View
                    style={{
                      flex: 1, flexDirection: 'row',
                      paddingBottom: 15,
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20',
                        textTransform: 'uppercase'
                      }}
                    >
                      Recurring
                    </Text>
                  </View>
                  <View style={{}}>
                    <View
                      style={{
                        backgroundColor: "white",
                        height: 40,
                        marginRight: 10,
                        flexDirection: 'row',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <Switch
                        value={!shuffle}
                        onValueChange={() => setShuffle(!shuffle)}
                        style={{ height: 20 }}
                        trackColor={{
                          false: "#F4F4F6",
                          true: "#818385",
                        }}
                        activeThumbColor="white"
                      />
                    </View>
                    {!shuffle ? (
                      <View
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          backgroundColor: "white",
                        }}
                      >
                        <Text style={styles.text}>
                          {PreferredLanguageText("remindEvery")}
                        </Text>
                        <Menu
                          onSelect={(cat: any) => {
                            setFrequency(cat.value);
                            setFrequencyName(cat.label);
                          }}
                        >
                          <MenuTrigger>
                            <Text
                              style={{
                                fontFamily: "inter",
                                fontSize: 14,
                                color: "#1D1D20",
                              }}
                            >
                              {frequencyName}
                              <Ionicons name="caret-down" size={14} />
                            </Text>
                          </MenuTrigger>
                          <MenuOptions
                            customStyles={{
                              optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: "#e9e9ec",
                                overflow: 'scroll',
                                maxHeight: '100%'
                              },
                            }}
                          >
                            {timedFrequencyOptions.map((item: any) => {
                              return (
                                <MenuOption value={item}>
                                  <Text>
                                    {item.value === "0" && channelId !== ""
                                      ? "Once"
                                      : item.label}
                                  </Text>
                                </MenuOption>
                              );
                            })}
                          </MenuOptions>
                        </Menu>
                      </View>
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "row",
                          backgroundColor: "white",
                        }}
                      >
                        <Text style={styles.text}>
                          {PreferredLanguageText("RemindOn")}
                        </Text>
                        <DatePicker
                          format="YYYY-MM-DD HH:mm"
                          value={endPlayAt}
                          preventOverflow={true}
                          appearance={'subtle'}
                          onChange={(event: any) => {
                            const date = new Date(event);
                            if (date < new Date()) return;

                            setEndPlayAt(date);
                          }}
                          // isValidDate={disablePastDt}
                          size={"xs"}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ) : null}
              {notify && !shuffle ? (
                <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                  <View
                    style={{
                      flex: 1, flexDirection: 'row',
                      paddingBottom: 15,
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20',
                        textTransform: 'uppercase'
                      }}
                    >
                      Indefinite
                    </Text>
                  </View>
                  <View style={{}}>
                    <View
                      style={{
                        backgroundColor: "white",
                        height: 40,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        marginRight: 10,
                      }}
                    >
                      <Switch
                        value={playChannelCueIndef}
                        onValueChange={() =>
                          setPlayChannelCueIndef(!playChannelCueIndef)
                        }
                        style={{ height: 20 }}
                        trackColor={{
                          false: "#F4F4F6",
                          true: "#818385",
                        }}
                        activeThumbColor="white"
                      />
                    </View>
                    {playChannelCueIndef ? null : (
                      <View
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "row",
                          backgroundColor: "white",
                        }}
                      >
                        <Text style={styles.text}>
                          {PreferredLanguageText("remindTill")}
                        </Text>
                        <DatePicker
                          format="YYYY-MM-DD HH:mm"
                          value={endPlayAt}
                          preventOverflow={true}
                          appearance={'subtle'}
                          onChange={(event: any) => {
                            const date = new Date(event);
                            if (date < new Date()) return;
                            setEndPlayAt(date);
                          }}
                          // isValidDate={disablePastDt}\
                          size={"xs"}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
            {/* if Quiz then ask Shuffle */}
            {isQuiz ? (
              <View style={{ width: "100%", flexDirection: width < 1024 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                  style={{
                    flex: 1, flexDirection: 'row',
                    paddingBottom: 15,
                    backgroundColor: "white",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      textTransform: 'uppercase',
                      fontFamily: 'inter',
                      color: '#1D1D20'
                    }}
                  >
                    Shuffle Questions
                  </Text>
                </View>
                <View>
                  <View
                    style={{
                      backgroundColor: "white",
                      height: 40,
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginRight: 10,
                    }}
                  >
                    <Switch
                      value={shuffleQuiz}
                      onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                      style={{ height: 20 }}
                      trackColor={{
                        false: "#F4F4F6",
                        true: "#818385",
                      }}
                      activeThumbColor="white"
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
          <View style={styles.footer}>
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                justifyContent: "center",
                display: "flex",
                flexDirection: "row",
                height: 50,
                paddingTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={async () => {
                  if (isQuiz) {
                    createNewQuiz();
                  } else {
                    await handleCreate();
                  }
                }}
                disabled={isSubmitting}
                style={{
                  borderRadius: 15,
                  backgroundColor: "white",
                }}
              >
                {channelId === "" ? (
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "white",
                      fontSize: 12,
                      backgroundColor: "#007AFF",
                      borderRadius: 15,
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      overflow: "hidden",
                      height: 35,
                      textTransform: "uppercase",
                    }}
                  >
                    {isSubmitting
                      ? 'Creating...'
                      : 'Create'}
                  </Text>
                ) : (
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: "white",
                      fontSize: 12,
                      backgroundColor: "#007AFF",
                      borderRadius: 15,
                      paddingHorizontal: 25,
                      fontFamily: "inter",
                      overflow: "hidden",
                      height: 35,
                      textTransform: "uppercase",
                    }}
                  >
                    {isSubmitting
                      ? 'Creating...'
                      : 'CREATE'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          {/* Collapsible ends here */}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

export default Create;

const styles: any = StyleSheet.create({
  timePicker: {
    width: 125,
    fontSize: 15,
    height: 45,
    color: "#1D1D20",
    borderRadius: 1,
    marginLeft: 10,
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  cuesInput: {
    width: "100%",
    backgroundColor: "#F4F4F6",
    borderRadius: 15,
    fontSize: 20,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: "4%",
  },
  footer: {
    width: "100%",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "row",
    marginTop: 80,
    lineHeight: 18,
  },
  colorContainer: {
    lineHeight: 20,
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    marginLeft: 7,
    paddingHorizontal: 4,
    backgroundColor: "white",
  },
  colorContainerOutline: {
    lineHeight: 22,
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    marginLeft: 7,
    paddingHorizontal: 4,
    backgroundColor: "white",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#818385",
  },
  input: {
    width: "100%",
    borderBottomColor: "#F4F4F6",
    borderBottomWidth: 1,
    fontSize: 15,
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 0,
    marginBottom: 20,
  },
  date: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    paddingBottom: 4,
    backgroundColor: "white",
  },
  colorBar: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "white",
    lineHeight: 20,
  },
  picker: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "white",
    overflow: "hidden",
    fontSize: 12,
    textAlign: "center",
    borderWidth: 1,
    width: 100,
    height: 20,
    alignSelf: "center",
    marginTop: -20,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    color: "#818385",
    textAlign: "left",
    paddingHorizontal: 10,
  },
  all: {
    fontSize: 12,
    color: "#818385",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },
  allBlack: {
    fontSize: 12,
    color: "#1D1D20",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
    marginBottom: 20,
  },
  allOutline: {
    fontSize: 12,
    color: "#FFF",
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 1,
    backgroundColor: "#1D1D20",
    marginBottom: 20,
  },
  allGrayOutline: {
    fontSize: 12,
    color: "#818385",
    height: 22,
    paddingHorizontal: 10,
    marginRight: 20,
    backgroundColor: "white",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#818385",
  },
  color1: {
    backgroundColor: "#D11C60",
  },
  color2: {
    backgroundColor: "#EF5B24",
  },
  color3: {
    backgroundColor: "#E0D41F",
  },
  color4: {
    backgroundColor: "#f9c74f",
  },
  color5: {
    backgroundColor: "#7FB1D3",
  },
  outline: {
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#818385",
  },
});