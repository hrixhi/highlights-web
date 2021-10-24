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
import WebViewer from '@pdftron/pdfjs-express';
import { Select, Datepicker as MobiscrollDatePicker } from '@mobiscroll/react'

import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';

import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import TextareaAutosize from 'react-textarea-autosize';
import { Editor } from '@tinymce/tinymce-react';
import FormulaGuide from './FormulaGuide';


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
  const [customCategory, setCustomCategory] = useState("None");
  const [localCustomCategories] = useState(props.customCategories);
  const [customCategories, setCustomCategories] = useState(
    props.customCategories
  );
  const [addCustomCategory, setAddCustomCategory] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [channelOptions, setChannelOptions] = useState<any[]>([]);
  const [showOptions, setShowOptions] = useState(false)
  const [channelId, setChannelId] = useState<any>("");
  const [selectedChannel, setSelectedChannel] = useState<any>("My Workspace")
  const [endPlayAt, setEndPlayAt] = useState(
    new Date(current.getTime() + 1000 * 60 * 60)
  );
  const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true);
  const colorChoices: any[] = [
    "#f94144",
    "#f3722c",
    "#f8961e",
    "#f9c74f",
    "#35AC78",
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
  const [initialQuizInstructions, setInitialQuizInstructions] = useState("");
  const [initialDuration, setInitialDuration] = useState(null);

  const [channelName, setChannelName] = useState("");
  const [limitedShare, setLimitedShare] = useState(false);

  // Submission allowed attempts
  const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
  const [attempts, setAttempts] = useState("1");

  const window = Dimensions.get("window");
  const screen = Dimensions.get("screen");

  const [dimensions, setDimensions] = useState({ window, screen });

  const [showFormulaGuide, setShowFormulaGuide] = useState(false);

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

    if (equation === "") {
      Alert('Equation cannot be empty.')
      return;
    }

    let currentContent = editorRef.current.getContent();

    const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
    currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "<br/></div>";

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
      type === "oga" ||
      type === "mov" ||
      type === "wmv" ||
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
        licenseKey: 'xswED5JutJBccg0DZhBM',
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


          if (role === "instructor") {

            // Add some default categories to the channel set

            const categories = new Set();

            res.data.channel.getChannelCategories.map((category: any) => {
              console.log("Channel category", category)
              categories.add(category);
            })

            categories.add("Assignments")
            categories.add("Homeworks")
            categories.add("Quizzes")
            categories.add("Syllabus")
            categories.add("Textbook")
            categories.add("Videos")


            const withDefaultCategories = Array.from(categories)

            setCustomCategories(withDefaultCategories)

          } else {
            setCustomCategories(res.data.channel.getChannelCategories);
          }

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
              value: sub.value,
              text: sub.label,
            };
          });

          const withoutOwner: any = [];
          const withoutOwnerIds: any = [];

          format.map((i: any) => {
            if (userId._id !== i.value) {
              withoutOwner.push(i);
              withoutOwnerIds.push(i.value);
            }
          });
          setSubscribers(withoutOwner);
          console.log("Subscribers", withoutOwner)
          // clear selected
          setSelected(withoutOwnerIds);
          console.log("Selected", withoutOwnerIds)
        }
      })
      .catch((err: any) => console.log(err));
  }, [channelId, localCustomCategories, role]);

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
            const options = [{
              value: 'My Workspace',
              text: 'My Workspace'
            }];

            res.data.channel.findByUserId.map((channel: any) => {
              options.push({
                value: channel._id,
                text: channel.name
              })
            })

            setChannelOptions(options)
          }
        })
        .catch((err) => { });
    }
    setInit(true);
  }, []);

  useEffect(() => {
    loadChannels();
  }, []);

  // Don't save question if no question entered
  const isCurrentQuestionValid = (problem: any) => {

    if (problem.question === "") {
      return false;
    }


    return true;

  }

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

      // Loop over entire quiz and save only the questions which are valid
      const validProblems = problems.filter((prob: any) => isCurrentQuestionValid(prob));

      const quiz = {
        title,
        problems: validProblems,
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
          customCategory: customCategory === "None" ? "" : customCategory,
          endPlayAt:
            notify && (shuffle || !playChannelCueIndef)
              ? endPlayAt.toISOString()
              : "",
        });
        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        storeDraft("cueDraft", "");
        // setIsSubmitting(false)
        props.closeOnCreate();
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
              ownerarray.push(i.channelCreatedBy);
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
        // const userIds: any[] = [];
        // if (selected.length !== 0) {
        //   selected.map((item) => {
        //     userIds.push(item);
        //   });
        // }


        const variables = {
          cue: saveCue,
          starred,
          color: color.toString(),
          channelId,
          frequency,
          customCategory: customCategory === "None" ? "" : customCategory,
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
            !limitedShare ? null : selected,
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
          setInitialQuizInstructions(quizInstructions);
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


  let categoriesOptions = [{
    value: 'None', text: 'None'
  }];

  customCategories.map((category: any) => {
    categoriesOptions.push({
      value: category,
      text: category
    })
  })


  return (
    <ScrollView
      style={{
        width: "100%",
        height:
          dimensions.window.width < 1024
            ? dimensions.window.height - 104
            : dimensions.window.height - 52,
        backgroundColor: "white",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        overflow: "scroll",
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: "white",
            opacity: modalAnimation,
            height: "100%",
            maxWidth: 900,
            paddingTop: 10,
            paddingHorizontal: dimensions.window.width < 1024 ? 20 : 0
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{
                paddingTop: 10,
                marginRight: 20
              }}
              onPress={() => {
                if (showOptions) {
                  setShowOptions(false)
                } else {
                  props.closeModal()
                }
              }}>
              <Text>
                <Ionicons name='arrow-back-outline' size={30} color={'#343A40'} />
              </Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flex: 1, paddingTop: 20 }}>
              {
                showOptions ? null :
                  <TouchableOpacity
                    onPress={() => setShowOptions(true)}
                    disabled={isSubmitting}
                    style={{
                      borderRadius: 15,
                      backgroundColor: "white",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: "#3289d0",
                        borderWidth: 1,
                        fontSize: 12,
                        borderColor: "#3289d0",
                        borderRadius: 15,
                        paddingHorizontal: 20,
                        fontFamily: "inter",
                        overflow: "hidden",
                        height: 35,
                        textTransform: "uppercase",
                      }}
                    >
                      NEXT
                    </Text>
                  </TouchableOpacity>
              }
            </View>
          </View>
          {
            showOptions ? null : <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "row",
                paddingBottom: 4,
                marginTop: 0,
                backgroundColor: "white",
                borderBottomWidth: imported || isQuiz ? 0 : 0,
                borderBottomColor: '#E7EBEE',
                justifyContent: 'flex-end'
              }}
              onTouchStart={() => Keyboard.dismiss()}
            >
              <View style={{ flexDirection: "row", paddingTop: 20 }}>
                {!isQuiz && !imported ? (
                  <Text
                    style={{
                      lineHeight: 35,
                      textAlign: "right",
                      paddingRight: 20,
                      textTransform: "uppercase",
                      fontSize: 12,
                      fontFamily: 'overpass',
                      color: '#3289d0',
                    }}
                    onPress={() => setShowEquationEditor(!showEquationEditor)}
                  >
                    {PreferredLanguageText("formula")}
                  </Text>
                ) : null}
                {isQuiz || imported ? null : (
                  <FileUpload
                    back={() => setShowImportOptions(false)}
                    onUpload={(u: any, t: any) => {
                      const obj = { url: u, type: t, title };
                      setCue(JSON.stringify(obj));
                      setShowImportOptions(false);
                    }}
                  />
                )}
                {
                  role === 'instructor' && !imported ? <Text
                    style={{
                      color: "#3289d0",
                      lineHeight: 35,
                      textAlign: "right",
                      // paddingRight: 10,
                      paddingLeft: 20,
                      textTransform: "uppercase",
                      fontSize: 12,
                      fontFamily: 'overpass',
                    }}
                    onPress={() => {
                      if (isQuiz) {
                        clearAll()
                        return
                      }
                      setIsQuiz(true);
                      setSubmission(true);
                    }}
                  >
                    {isQuiz ? 'Clear' : PreferredLanguageText("quiz")}
                  </Text> : null
                }
              </View>
            </View>
          }
          {!showOptions ? <FormulaGuide value={equation} onChange={setEquation} show={showEquationEditor} onClose={() => setShowEquationEditor(false)} onInsertEquation={insertEquation} /> : null}
          <View
            style={{ paddingBottom: 100 }}
          >
            {
              showOptions ?
                <View
                  style={{
                    width: '100%',
                    display: "flex",
                    flexDirection: "column",
                    marginHorizontal: 10,
                    maxWidth: 900, alignSelf: 'center',
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
                          borderColor: "#E7EBEE",
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
                              fontSize: 14,
                              color: '#16181C',
                              fontWeight: 'bold'
                            }}
                          >
                            For
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
                            <label style={{ width: 180 }}>
                              <Select
                                touchUi={true}
                                value={selectedChannel}
                                // rows={channels.length + 1}
                                themeVariant="light"
                                onChange={(val) => {

                                  const channel = val.value;

                                  if (channel === "My Workspace") {
                                    setSelectedChannel("My Workspace")
                                    setChannelId("");
                                    setCustomCategories(localCustomCategories);
                                    setCustomCategory("None");
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
                                    const match = channels.find((c: any) => {
                                      return c._id === channel
                                    })
                                    setSelectedChannel(match._id)
                                    setChannelId(match._id);
                                    setChannelName(match.name);
                                    setAddCustomCategory(false);
                                    setCustomCategory("None");
                                    setSubmission(isQuiz ? true : false);
                                    setGradeWeight(0);
                                    setGraded(false);
                                  }
                                }}
                                responsive={{
                                  small: {
                                    display: 'bubble'
                                  },
                                  medium: {
                                    touchUi: false
                                  }
                                }}
                                data={channelOptions}
                              />
                            </label>
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
                                fontSize: 14,
                                // fontWeight: 'bold',
                                color: '#16181C',
                                fontWeight: 'bold'
                              }}
                            >
                              Share With All
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
                                  true: "#3289d0",
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
                                  <label>
                                    <Select
                                      touchUi={true}
                                      placeholder="Select..."
                                      themeVariant="light"
                                      value={selected}
                                      data={subscribers}
                                      selectMultiple={true}
                                      onChange={(val: any) => {
                                        setSelected(val.value)
                                      }}
                                      responsive={{
                                        small: {
                                          display: 'bubble'
                                        },
                                        medium: {
                                          touchUi: false,
                                        }
                                      }}
                                      minWidth={[60, 320]}
                                    // minWidth={[60, 320]}
                                    />
                                  </label>
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
                                fontSize: 14,
                                color: '#16181C',
                                fontWeight: 'bold'
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
                                  false: "#E7EBEE",
                                  true: "#3289d0",
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
                                    {/* <DatePicker
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
                              /> */}
                                    <MobiscrollDatePicker
                                      controls={['date', 'time']}
                                      touchUi={true}
                                      value={initiateAt}
                                      themeVariant="light"
                                      inputComponent="input"
                                      inputProps={{
                                        placeholder: 'Please Select...'
                                      }}
                                      onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        const roundValue = roundSeconds(date)
                                        if (date < new Date()) return;
                                        setInitiateAt(roundValue);
                                      }}
                                      responsive={{
                                        xsmall: {
                                          controls: ['date', 'time'],
                                          display: 'bottom',
                                          touchUi: true
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                          controls: ['date', 'time'],
                                          display: 'anchored',
                                          touchUi: false
                                        },
                                      }}

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
                                    {/* <DatePicker
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
                              /> */}
                                    <MobiscrollDatePicker
                                      controls={['date', 'time']}
                                      touchUi={true}
                                      theme="ios"
                                      value={deadline}
                                      themeVariant="light"
                                      inputComponent="input"
                                      inputProps={{
                                        placeholder: 'Please Select...'
                                      }}
                                      onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        if (date < new Date()) return;
                                        const roundValue = roundSeconds(date)
                                        setDeadline(roundValue);
                                      }}
                                      responsive={{
                                        xsmall: {
                                          controls: ['date', 'time'],
                                          display: 'bottom',
                                          touchUi: true
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                          controls: ['date', 'time'],
                                          display: 'anchored',
                                          touchUi: false
                                        },
                                      }}

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
                                fontSize: 14,
                                color: '#16181C',
                                fontWeight: 'bold'
                              }}
                            >
                              Grade Weight
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
                                    false: "#E7EBEE",
                                    true: "#343A40",
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
                                    color: "#343A40",
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
                                      borderBottomColor: "#E7EBEE",
                                      borderBottomWidth: 1,
                                      fontSize: 14,
                                      padding: 15,
                                      paddingVertical: 12,
                                      marginTop: 0,
                                    }}
                                    placeholder={"0-100"}
                                    onChangeText={(val) => setGradeWeight(val)}
                                    placeholderTextColor={"#343A40"}
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
                                fontSize: 14,
                                color: '#16181C',
                                fontWeight: 'bold'
                              }}
                            >
                              Late Submission
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
                                    false: "#E7EBEE",
                                    true: "#343A40",
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
                                  {/* <DatePicker
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
                            /> */}
                                  <MobiscrollDatePicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={availableUntil}
                                    themeVariant="light"
                                    inputComponent="input"
                                    inputProps={{
                                      placeholder: 'Please Select...'
                                    }}
                                    onChange={(event: any) => {
                                      const date = new Date(event.value);
                                      if (date < deadline) return;
                                      const roundValue = roundSeconds(date)
                                      setAvailableUntil(roundValue);
                                    }}
                                    responsive={{
                                      xsmall: {
                                        controls: ['date', 'time'],
                                        display: 'bottom',
                                        touchUi: true
                                      },
                                      // small: {
                                      //     controls: ['date', 'time'],
                                      //     display: 'anchored',
                                      //     touchUi: true
                                      // },
                                      medium: {
                                        controls: ['date', 'time'],
                                        display: 'anchored',
                                        touchUi: false
                                      },
                                    }}

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
                                fontSize: 14,
                                color: '#16181C',
                                fontWeight: 'bold'
                              }}
                            >
                              Multiple Attempts
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
                                  true: "#343A40",
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
                                    fontSize: 14,
                                    padding: 15,
                                    paddingVertical: 12,
                                    marginTop: 0,
                                  }}
                                  placeholder={""}
                                  onChangeText={(val) => {
                                    if (Number.isNaN(Number(val))) return;
                                    setAttempts(val)
                                  }}
                                  placeholderTextColor={"#343A40"}
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
                        borderColor: "#E7EBEE",
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
                              fontSize: 14,
                              fontWeight: 'bold',
                              color: '#16181C'
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
                            alignItems: 'center'
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
                                  placeholderTextColor={"#343A40"}
                                />
                              </View>
                            ) : (

                              <label style={{ width: 180 }}>
                                <Select
                                  touchUi={true}
                                  cssClass="customDropdown"
                                  value={customCategory}
                                  rows={customCategories.length + 1}
                                  data={categoriesOptions}
                                  themeVariant="light"
                                  onChange={(val: any) => {
                                    setCustomCategory(val.value)
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
                            )}
                          </View>
                          <View style={{ width: "15%", backgroundColor: "white", paddingLeft: 20 }}>
                            <TouchableOpacity
                              onPress={() => {
                                if (addCustomCategory) {
                                  setCustomCategory("None");
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
                                  size={15}
                                  color={"#16181C"}
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
                        borderColor: "#E7EBEE",
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
                            fontSize: 14,
                            color: '#16181C',
                            fontWeight: 'bold'
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
                            fontSize: 14,
                            color: '#16181C',
                            fontWeight: 'bold'
                          }}
                        >
                          Remind
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
                            false: "#E7EBEE",
                            true: "#3289d0",
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
                              fontSize: 14,
                              color: '#16181C',
                              fontWeight: 'bold'
                            }}
                          >
                            Repeat
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
                                false: "#E7EBEE",
                                true: "#343A40",
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
                                alignItems: 'center'
                              }}
                            >
                              <Text style={{
                                fontSize: 12,
                                color: "#343A40",
                                textAlign: "right",
                                paddingRight: 10,
                                paddingBottom: 10
                              }}>
                                {PreferredLanguageText("remindEvery")}
                              </Text>
                              <label style={{ width: 140 }}>
                                <Select
                                  touchUi={true}
                                  themeVariant="light"
                                  value={frequency}
                                  rows={timedFrequencyOptions.length}
                                  onChange={(val: any) => {
                                    setFrequency(val.value);
                                  }}
                                  responsive={{
                                    small: {
                                      display: 'bubble'
                                    },
                                    medium: {
                                      touchUi: false,
                                    }
                                  }}
                                  data={timedFrequencyOptions.map((freq: any) => {
                                    return {
                                      value: freq.value,
                                      text: freq.label
                                    }
                                  })}
                                />
                              </label>
                              {/* <Menu
                          onSelect={(cat: any) => {
                            setFrequency(cat.value);
                            setFrequencyName(cat.label);
                          }}
                        >
                          <MenuTrigger>
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#343A40",
                                textAlign: "right",
                                paddingRight: 10,
                                paddingTop: 3
                              }}
                            >
                              {frequencyName}
                              <Ionicons name="chevron-down-outline" size={15} />
                            </Text>
                          </MenuTrigger>
                          <MenuOptions
                            customStyles={{
                              optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: "#E7EBEE",
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
                        </Menu> */}
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
                              <View>
                                <Text style={
                                  {
                                    fontSize: 12,
                                    color: "#343A40",
                                    textAlign: "right",
                                    paddingRight: 10,
                                    marginTop: 5
                                  }
                                }>
                                  {PreferredLanguageText("RemindOn")}
                                </Text>
                              </View>
                              <View>
                                {/* <DatePicker
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
                          /> */}
                                <MobiscrollDatePicker
                                  controls={['date', 'time']}
                                  touchUi={true}
                                  theme="ios"
                                  value={endPlayAt}
                                  themeVariant="light"
                                  inputComponent="input"
                                  inputProps={{
                                    placeholder: 'Please Select...'
                                  }}
                                  onChange={(event: any) => {
                                    const date = new Date(event.value);
                                    if (date < new Date()) return;

                                    setEndPlayAt(date);
                                  }}
                                  responsive={{
                                    xsmall: {
                                      controls: ['date', 'time'],
                                      display: 'bottom',
                                      touchUi: true
                                    },
                                    // small: {
                                    //     controls: ['date', 'time'],
                                    //     display: 'anchored',
                                    //     touchUi: true
                                    // },
                                    medium: {
                                      controls: ['date', 'time'],
                                      display: 'anchored',
                                      touchUi: false
                                    },
                                  }}

                                />

                              </View>
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
                              fontSize: 14,
                              fontWeight: 'bold',
                              color: '#16181C'
                            }}
                          >
                            Indefinitely
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
                                false: "#E7EBEE",
                                true: "#343A40",
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
                              {/* <DatePicker
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
                        /> */}

                              <MobiscrollDatePicker
                                controls={['date', 'time']}
                                touchUi={true}
                                theme="ios"
                                value={endPlayAt}
                                themeVariant="light"
                                inputComponent="input"
                                inputProps={{
                                  placeholder: 'Please Select...'
                                }}
                                onChange={(event: any) => {
                                  const date = new Date(event.value);
                                  if (date < new Date()) return;
                                  setEndPlayAt(date);
                                }}
                                responsive={{
                                  xsmall: {
                                    controls: ['date', 'time'],
                                    display: 'bottom',
                                    touchUi: true
                                  },
                                  // small: {
                                  //     controls: ['date', 'time'],
                                  //     display: 'anchored',
                                  //     touchUi: true
                                  // },
                                  medium: {
                                    controls: ['date', 'time'],
                                    display: 'anchored',
                                    touchUi: false
                                  },
                                }}

                              />

                            </View>
                          )}
                        </View>
                      </View>
                    ) : null}
                  </View>
                  {/* Timed Quiz */}
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
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#16181C'
                          }}
                        >
                          Timed
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
                              false: "#E7EBEE",
                              true: "#343A40",
                            }}
                            activeThumbColor="white"
                          />
                        </View>
                        {timer ? (
                          <View
                            style={{
                              borderRightWidth: 0,
                              paddingTop: 0,
                              borderColor: "#E7EBEE",
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
                                      fontSize: 15,
                                      color: "#16181C",
                                    }}
                                  >
                                    {duration.hours} H <Ionicons name="chevron-down-outline" size={15} /> &nbsp; &nbsp;: &nbsp; &nbsp;
                                  </Text>
                                </MenuTrigger>
                                <MenuOptions
                                  customStyles={{
                                    optionsContainer: {
                                      padding: 10,
                                      borderRadius: 15,
                                      shadowOpacity: 0,
                                      borderWidth: 1,
                                      borderColor: "#E7EBEE",
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
                                      fontSize: 15,
                                      color: "#16181C",
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
                                      borderColor: "#E7EBEE",
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
                  ) : null}

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
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#16181C'
                          }}
                        >
                          Random Order
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
                              false: "#E7EBEE",
                              true: "#343A40",
                            }}
                            activeThumbColor="white"
                          />
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
                : <>
                  {imported || isQuiz ? (
                    <View
                      style={{
                        // display: "flex",
                        flexDirection: width < 1024 ? "column" : "row",
                        // overflow: "visible",
                      }}
                    >
                      <View
                        style={{
                          width: width < 1024 ? "100%" : "50%",
                          maxWidth: 400,
                          borderRightWidth: 0,
                          borderColor: "#E7EBEE",
                          // paddingRight: 15,
                          // display: "flex",
                          // paddingLeft: isQuiz && Dimensions.get('window').width > 768 ? 20 : 0,
                          flexDirection: "row",
                        }}
                      >
                        <TextareaAutosize
                          value={title}
                          style={{
                            width: "100%",
                            maxWidth: '100%',
                            borderBottom: '1px solid #E7EBEE',
                            fontSize: 14,
                            paddingTop: 13,
                            paddingBottom: 13,
                            marginTop: 12,
                            marginBottom: 15,
                            borderRadius: 1,
                            height: 35
                          }}
                          // style={styles.input}
                          minRows={1}
                          placeholder={PreferredLanguageText("title")}
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
                              {/* <Ionicons
                              name="close-circle-outline"
                              color="#343A40"
                              size={15}
                              style={{ alignSelf: "center" }}
                            /> */}
                              <Text
                                style={{
                                  fontSize: 12,
                                  lineHeight: 35,
                                  fontFamily: 'inter',
                                  color: "#3289d0",
                                  // textAlign: "center",
                                }}
                              >
                                Clear
                              </Text>
                            </TouchableOpacity> : null
                        }
                      </View>
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
                          // paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0,
                          flexDirection: 'row',
                          width: '100%'
                        }}>
                          <View style={{
                            width: '100%',
                            // paddingRight: Dimensions.get('window').width > 768 ? 15 : 0,
                            paddingTop: 15
                          }}>
                            <Editor
                              // onInit={(evt, editor) => RichText.current = editor}
                              initialValue={initialQuizInstructions}
                              apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                              init={{
                                skin: "snow",
                                // toolbar_sticky: true,
                                indent: false,
                                branding: false,
                                placeholder: 'Instructions',
                                autoresize_on_init: false,
                                autoresize_min_height: 200,
                                height: 200,
                                min_height: 200,
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
                                toolbar: 'undo redo | bold italic underline strikethrough |  numlist bullist checklist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                                importcss_append: true,
                                image_caption: true,
                                quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                noneditable_noneditable_class: 'mceNonEditable',
                                toolbar_mode: 'sliding',
                                // tinycomments_mode: 'embedded',
                                content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #343A40;}",
                                // contextmenu: 'link image table configurepermanentpen',
                                // a11y_advanced_options: true,
                                extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                // content_css: useDarkMode ? 'dark' : 'default',

                              }}
                              onChange={(e: any) => {
                                setQuizInstructions(e.target.getContent())
                              }}
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
                        type === "oga" ||
                        type === "mov" ||
                        type === "wmv" ||
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
                          <div className="webviewer" ref={RichText} style={{ height: Dimensions.get('window').width < 1024 ? "50vh" : "70vh", borderWidth: 1, borderColor: '#E7EBEE', borderRadius: 1 }}></div>
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
                // borderColor: "#343A40",
              }}
              editorStyle={{
                backgroundColor: "#fff",
                placeholderColor: "#343A40",
                color: "#16181C",
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
                      initialValue={cueDraft !== "" ? cueDraft : "<h2>Title</h2>"}
                      apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                      init={{
                        skin: "snow",
                        // toolbar_sticky: true,
                        branding: false,
                        placeholder: 'Content...',
                        min_height: 500,
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
                        toolbar: 'undo redo | bold italic underline strikethrough | superscript subscript | fontselect fontSizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat  pagebreak | table image media pageembed link | preview print | charmap emoticons |  ltr rtl | showcomments addcomment',
                        importcss_append: true,
                        image_caption: true,
                        quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 quickimage quicktable',
                        noneditable_noneditable_class: 'mceNonEditable',
                        toolbar_mode: 'sliding',
                        content_style: ".mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #343A40;}",
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
                </>
            }
            {
              !showOptions ? null :
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

                          if (channelId === "") {
                            Alert("Select a channel to share quiz.")
                            return;
                          }

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
                            backgroundColor: "#3289d0",
                            borderRadius: 15,
                            paddingHorizontal: 20,
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
                            backgroundColor: "#3289d0",
                            borderRadius: 15,
                            paddingHorizontal: 20,
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
            }
            {/* Collapsible ends here */}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
};

export default Create;

const styles: any = StyleSheet.create({
  timePicker: {
    width: 125,
    fontSize: 14,
    height: 45,
    color: "#16181C",
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
    backgroundColor: "#E7EBEE",
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
    lineHeight: 20,
    justifyContent: "center",
    display: "flex",
    flexDirection: "column",
    marginLeft: 7,
    paddingHorizontal: 4,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#343A40"
  },
  input: {
    width: "100%",
    borderBottomColor: "#E7EBEE",
    borderBottomWidth: 1,
    fontSize: 14,
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
    color: "#343A40",
    textAlign: "left",
    paddingHorizontal: 10,
  },
  all: {
    fontSize: 12,
    color: "#343A40",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },
  allBlack: {
    fontSize: 12,
    color: "#16181C",
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
    backgroundColor: "#16181C",
    marginBottom: 20,
  },
  allGrayOutline: {
    fontSize: 12,
    color: "#343A40",
    height: 25,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 20,
    backgroundColor: "white",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#343A40",
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
    borderColor: "#343A40",
  },
});