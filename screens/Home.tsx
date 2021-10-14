import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet, Animated, ActivityIndicator, Dimensions,
  Image
} from 'react-native';
import { TextInput } from "../components/CustomTextInput";
import Alert from '../components/Alert'
import BottomBar from '../components/BottomBar';
import CardsList from '../components/CardsList';
import { Text, TouchableOpacity, View } from '../components/Themed';
import TopBar from '../components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import ChannelSettings from '../components/ChannelSettings'
import Create from '../components/Create';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Update from '../components/Update';
import { uniqueNamesGenerator, colors } from 'unique-names-generator'
import { defaultCues, defaultRandomShuffleFrequency, defaultSleepInfo } from '../helpers/DefaultData'
import Walkthrough from '../components/Walkthrough';
import Channels from '../components/Channels';
import { fetchAPI } from '../graphql/FetchAPI';
import { createUser, getSubscriptions, getCues, unsubscribe, saveConfigToCloud, saveCuesToCloud, login, getCuesFromCloud, findUserById, resetPassword, totalUnreadDiscussionThreads, totalUnreadMessages, getMeetingStatus } from '../graphql/QueriesAndMutations';
import Discussion from '../components/Discussion';
import Subscribers from '../components/Subscribers';
import Profile from '../components/Profile';
import { validateEmail } from '../helpers/emailCheck';
import Grades from '../components/Grades';
import Calendar from '../components/Calendar';
import Meeting from '../components/Meeting';
import { PreferredLanguageText, LanguageSelect } from '../helpers/LanguageContext';
import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg'

// Web Notification
import OneSignal, { useOneSignalSetup } from 'react-onesignal';
import Dashboard from '../components/Dashboard';
import FilterBar from '../components/FilterBar';
import VerticalBar from '../components/VerticalBar';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

  const window = Dimensions.get("window");
  const screen = Dimensions.get("screen");

  const [init, setInit] = useState(false)
  const [filterChoice, setFilterChoice] = useState('All')
  const [customCategories, setCustomCategories] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [cues, setCues] = useState<any>({})
  // not required
  const [sleepFrom, setSleepFrom] = useState(new Date())
  const [sleepTo, setSleepTo] = useState(new Date())
  const [randomShuffleFrequency, setRandomShuffleFrequency] = useState('1-D')
  // end of not required
  const [reLoading, setReLoading] = useState(true)
  const [fadeAnimation] = useState(new Animated.Value(0))
  const sheetRef: any = useRef(null);
  const [updateModalIndex, setUpdateModalIndex] = useState(0)
  const [updateModalKey, setUpdateModalKey] = useState('local')
  const [modalType, setModalType] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [channelId, setChannelId] = useState('')
  const [cueId, setCueId] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [channelCreatedBy, setChannelCreatedBy] = useState('')
  const [channelFilterChoice, setChannelFilterChoice] = useState('All')
  const [showLoginWindow, setShowLoginWindow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reopenUpdateWindow, setReopenUpdateWindow] = useState(Math.random())
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true)
  const [saveDataInProgress, setSaveDataInProgress] = useState(false)
  const [dimensions, setDimensions] = useState({ window, screen });
  const [target, setTarget] = useState('');
  const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState('');
  const [openChannelId, setOpenChannelId] = useState('');


  // Notifications count for Top Bar
  const [unreadDiscussionThreads, setUnreadDiscussionThreads] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [meetingOn, setMeetingOn] = useState(false)

  // Login Validation
  const [emailValidError, setEmailValidError] = useState("");

  const enterValidEmailError = PreferredLanguageText('enterValidEmail')
  const alreadyUnsubscribedAlert = PreferredLanguageText('alreadyUnsubscribed')
  const checkConnectionAlert = PreferredLanguageText('checkConnection')
  const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrongAlert')
  const eraseContentLeaveChannelAlert = PreferredLanguageText('eraseContentLeaveChannel')
  const thisActionWillIrreversiblyAlert = PreferredLanguageText('thisActionWillIrreversibly')
  const eraseContentAndUnsubscrbeAlert = PreferredLanguageText('eraseContentAndUnsubscrbe')
  const weHaveEmailedPasswordAlert = PreferredLanguageText('weHaveEmailedPassword')
  const invalidCredentialsAlert = PreferredLanguageText('invalidCredentials')
  const unableToRefreshCuesAlert = PreferredLanguageText('unableToRefreshCues')
  const leaveChannelAlert = PreferredLanguageText('leaveChannel')
  const areYouSureUnsubscribeAlert = PreferredLanguageText('areYouSureUnsubscribe')
  const keepContentAndUnsubscribeAlert = PreferredLanguageText('keepContentAndUnsubscribe')
  const [filterStart, setFilterStart] = useState<any>(new Date())
  const [filterEnd, setFilterEnd] = useState<any>(null)

  const [option, setOption] = useState('To Do')
  const [options] = useState(['To Do', 'Classroom', 'Performance', 'Inbox', 'Channels', 'Settings'])

  const [navOptions] = useState([
    {
      id: 'Home',
      text: 'Home',
      icon: 'home'
    },
    {
      id: 'Content',
      text: 'Content',
      icon: 'book'
    },
    {
      id: 'Inbox',
      text: 'Inbox',
      icon: 'material-inbox'
    },
    {
      id: 'Performance',
      text: 'Performance',
      icon: 'material-check'
    },
    {
      id: 'Channels',
      text: 'Channels',
      icon: 'material-people'
    },
    {
      id: 'Settings',
      text: 'Settings',
      icon: 'material-tune'
    }
  ])

  const [menuCollapsed, setMenuCollapsed] = useState(true)

  const [showHome, setShowHome] = useState(true)

  useEffect(() => {
    if (email && !validateEmail(email.toString().toLowerCase())) {
      setEmailValidError(enterValidEmailError);
      return;
    }

    setEmailValidError("");
  }, [email]);

  //   Validate Submit on Login state change
  useEffect(() => {

    // Login
    if (
      !showForgotPassword &&
      email &&
      password &&
      !emailValidError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // 
    if (showForgotPassword && email && !emailValidError) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [
    showForgotPassword,
    email,
    password,
    emailValidError,
  ]);

  const onDimensionsChange = useCallback(({ window, screen }: any) => {
    // window.location.reload()
    setDimensions({ window, screen })
  }, []);

  // useEffect(() => {
  //   Dimensions.addEventListener("change", onDimensionsChange);
  //   return () => {
  //     Dimensions.removeEventListener("change", onDimensionsChange);
  //   };
  // }, [])

  useEffect(() => {
    if (option === "Classroom") return;

    setLoadDiscussionForChannelId('')
    setOpenChannelId('')
  }, [option])

  useEffect(() => {
    (
      async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
          const parsedUser: any = JSON.parse(u)
          if (parsedUser.email && parsedUser.email !== '') {
            // do nothing
          } else {
            setShowLoginWindow(true)
          }
        } else {
          setShowLoginWindow(true)
        }
      }
    )()
  }, [])


  useEffect(() => {

    if (channelId !== '') {
      (
        async () => {
          const u = await AsyncStorage.getItem('user')
          if (u) {
            const user = JSON.parse(u)

            const server = fetchAPI('')
            server.query({
              query: totalUnreadDiscussionThreads,
              variables: {
                userId: user._id,
                channelId
              }
            }).then(res => {
              if (res.data.threadStatus.totalUnreadDiscussionThreads) {
                setUnreadDiscussionThreads(res.data.threadStatus.totalUnreadDiscussionThreads)
              }
            })
            server.query({
              query: totalUnreadMessages,
              variables: {
                userId: user._id,
                channelId
              }
            }).then(res => {
              if (res.data.messageStatus.totalUnreadMessages) {
                setUnreadMessages(res.data.messageStatus.totalUnreadMessages)
              }
            })
            server.query({
              query: getMeetingStatus,
              variables: {
                channelId
              }
            }).then(res => {
              if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
                setMeetingOn(true)
              } else {
                setMeetingOn(false)
              }
            })
              .catch(err => console.log(err))
          }
        }
      )()
    }

  }, [channelId, channelCreatedBy, email])



  const refreshUnreadMessagesCount = useCallback(async () => {
    if (channelId !== '') {
      const u = await AsyncStorage.getItem('user')
      if (u) {
        const user = JSON.parse(u)
        updateMessageNotifCounts(user._id)

      }
    }

  }, [channelId])

  const refreshMeetingStatus = useCallback(async () => {
    if (channelId !== '') {
      const server = fetchAPI('')
      server.query({
        query: getMeetingStatus,
        variables: {
          channelId
        }
      }).then(res => {
        if (res.data && res.data.channel && res.data.channel.getMeetingStatus) {
          setMeetingOn(true)
        } else {
          setMeetingOn(false)
        }
      })
    }

  }, [channelId])

  const updateMessageNotifCounts = useCallback((userId) => {
    const server = fetchAPI('')
    server.query({
      query: totalUnreadMessages,
      variables: {
        userId,
        channelId
      }
    }).then(res => {
      if (res.data.messageStatus.totalUnreadMessages !== undefined && res.data.messageStatus.totalUnreadMessages !== null) {
        setUnreadMessages(res.data.messageStatus.totalUnreadMessages)
      }
    })
      .catch(err => console.log(err))
  }, [channelId])



  const storeMenu = useCallback(async () => {
    try {
      await AsyncStorage.setItem('sleepFrom', sleepFrom.toString())
      await AsyncStorage.setItem('sleepTo', sleepTo.toString())
      await AsyncStorage.setItem('randomShuffleFrequency', randomShuffleFrequency)
    } catch (e) {
      // error storing
      console.log(e)
    }
  }, [randomShuffleFrequency, sleepTo, sleepFrom])

  // imp
  const loadNewChannelCues = useCallback(async () => {

    let user = await AsyncStorage.getItem('user')
    const unparsedCues = await AsyncStorage.getItem('cues')
    if (user && unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
      const parsedUser = JSON.parse(user)
      const server = fetchAPI(parsedUser._id)

      try {
        const res = await server.query({
          query: getCues,
          variables: {
            userId: parsedUser._id
          }
        })

        if (res.data.cue.findByUserId) {
          // Here we load all new Cues
          // we update statuses for the cues that are already stored and add new cues to the list
          // (cant directly replace the store because channel cues could be modified by the user)
          const receivedCues = res.data.cue.findByUserId;
          receivedCues.map((item: any) => {
            const channelId = item.channelId.toString().trim();
            let index = -1;
            if (allCues[channelId]) {
              index = allCues[channelId].findIndex((cue: any) => {
                return cue._id.toString().trim() === item._id.toString().trim()
              })
            }
            if (index === -1) {
              let cue: any = {}
              cue = {
                ...item
              }
              delete cue.__typename
              if (allCues[cue.channelId]) {
                allCues[cue.channelId].push(cue)
              } else {
                allCues[cue.channelId] = [cue]
              }
            } else {
              allCues[item.channelId][index].unreadThreads = item.unreadThreads ? item.unreadThreads : 0;
              allCues[item.channelId][index].status = item.status;
              allCues[item.channelId][index].folderId = item.folderId;
              if (!allCues[item.channelId][index].original) {
                allCues[item.channelId][index].original = item.cue;
              }
            }
          })
          const custom: any = {}
          setCues(allCues)
          if (allCues['local']) {
            allCues['local'].map((item: any) => {
              if (item.customCategory !== "") {
                if (!custom[item.customCategory]) {
                  custom[item.customCategory] = 0
                }
              }
            })
            const customC: any[] = []
            Object.keys(custom).map((item) => {
              customC.push(item)
            })
            customC.sort()
            setCustomCategories(customC)
          }
          const stringCues = JSON.stringify(allCues)
          await AsyncStorage.setItem("cues", stringCues)
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
          }).start();
          setReLoading(false)
        }

      } catch (err) {

        Alert(unableToRefreshCuesAlert, checkConnectionAlert)
        const custom: any = {}
        setCues(allCues)
        if (allCues['local']) {
          allCues['local'].map((item: any) => {
            if (item.customCategory !== "") {
              if (!custom[item.customCategory]) {
                custom[item.customCategory] = 0
              }
            }
          })
          const customC: any[] = []
          Object.keys(custom).map((item) => {
            customC.push(item)
          })
          customC.sort()
          setCustomCategories(customC)
        }
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
        setReLoading(false)
      }
    } else if (unparsedCues) {
      const custom: any = {}
      const allCues = JSON.parse(unparsedCues)
      setCues(allCues)
      if (allCues['local']) {
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCustomCategories(customC)
      }
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
      setReLoading(false)
    }
  }, [])

  useOneSignalSetup(async () => {

    const permissions = OneSignal.notificationPermission;

    // Check current permission state
    const currentState = await OneSignal.getNotificationPermission();

    if (currentState !== "granted") {
      OneSignal.registerForPushNotifications();
    } else {

      // If permission granted and logged in then ensure user external id is added

      const externalUserId = await OneSignal.getExternalUserId();

      if (!externalUserId) {
        let user = await AsyncStorage.getItem('user')

        if (user) {
          const parsedUser = JSON.parse(user);
          if (parsedUser.email) {
            await OneSignal.setExternalUserId(parsedUser._id)
          }
        }
      }
    }
  });

  const unsubscribeChannel = useCallback(() => {
    Alert(
      leaveChannelAlert,
      areYouSureUnsubscribeAlert + filterChoice + "?",
      [
        {
          text: "Cancel", style: "cancel"
        },
        {
          text: keepContentAndUnsubscribeAlert, onPress: async () => {
            let user = await AsyncStorage.getItem('user')
            if (user) {
              const parsedUser = JSON.parse(user)
              const server = fetchAPI('')
              server.mutate({
                mutation: unsubscribe,
                variables: {
                  userId: parsedUser._id,
                  channelId,
                  keepContent: true
                }
              }).then(res => {
                if (res.data.subscription && res.data.subscription.unsubscribe) {
                  setChannelId('')
                  setFilterChoice('All')
                  closeModal()
                  loadData()
                } else {
                  Alert(alreadyUnsubscribedAlert)
                }
              }).catch(err => {
                Alert(somethingWentWrongAlert, checkConnectionAlert)
              })
            }
          }
        }
      ]
    );
  }, [channelId, filterChoice])

  const deleteChannel = useCallback(() => {
    Alert(
      eraseContentLeaveChannelAlert,
      thisActionWillIrreversiblyAlert + filterChoice + ".",
      [
        {
          text: "Cancel", style: "cancel"
        },
        {
          text: eraseContentAndUnsubscrbeAlert, onPress: async () => {
            let user = await AsyncStorage.getItem('user')
            if (user) {
              const parsedUser = JSON.parse(user)
              const server = fetchAPI('')
              server.mutate({
                mutation: unsubscribe,
                variables: {
                  userId: parsedUser._id,
                  channelId,
                  keepContent: false
                }
              }).then(async res => {
                if (res.data.subscription && res.data.subscription.unsubscribe) {
                  let subCues: any = {}
                  try {
                    const value = await AsyncStorage.getItem('cues')
                    if (value) {
                      subCues = JSON.parse(value)
                      if (subCues[channelId]) {
                        delete subCues[channelId]
                      }
                      const stringifiedCues = JSON.stringify(subCues)
                      await AsyncStorage.setItem('cues', stringifiedCues)
                    }
                  } catch (e) {
                    return
                  }
                  setChannelId('')
                  setFilterChoice('All')
                  closeModal()
                  loadData()
                } else {
                  Alert(alreadyUnsubscribedAlert)
                }
              }).catch(err => {
                Alert(somethingWentWrongAlert, checkConnectionAlert)
              })
            }
          }
        },
      ]
    );
  }, [channelId, filterChoice])

  // imp
  const loadData = useCallback(async (saveData?: boolean) => {
    setReLoading(true)
    try {

      const version = 'v0.9'
      const server = fetchAPI('')
      const fO = await AsyncStorage.getItem(version)

      // LOAD FIRST OPENED
      if (fO === undefined || fO === null) {
        try {
          await AsyncStorage.clear()
          await AsyncStorage.setItem(version, 'SET')
        } catch (e) {
        }
      }

      let u = await AsyncStorage.getItem('user')
      const f = await AsyncStorage.getItem('randomShuffleFrequency')
      const sF = await AsyncStorage.getItem('sleepFrom')
      const sT = await AsyncStorage.getItem('sleepTo')
      const sC = await AsyncStorage.getItem('cues')
      const sub = await AsyncStorage.getItem('subscriptions')

      // LOAD USER OR CREATE A NEW ONE IF NOT FOUND
      if (!u) {
        const fullName = uniqueNamesGenerator({
          dictionaries: [colors]
        }) + Math.floor(Math.random() * (999 - 100 + 1) + 100).toString();
        const displayName = fullName
        const notificationId = 'NOT_SET';
        server.mutate({
          mutation: createUser,
          variables: {
            fullName,
            displayName,
            notificationId
          }
        })
          .then(async res => {
            const u = res.data.user.create
            if (u.__typename) {
              delete u.__typename
            }
            const sU = JSON.stringify(u)
            await AsyncStorage.setItem('user', sU)
          })
          .catch(err => {
            // no message needed here
          })
        // OPEN LOGIN WINDOW
      }
      // LOAD RANDOM SHUFFLE FREQUENCY
      if (f) {
        setRandomShuffleFrequency(f)
      } else {
        setRandomShuffleFrequency(defaultRandomShuffleFrequency)
        await AsyncStorage.setItem('randomShuffleFrequency', defaultRandomShuffleFrequency)
      }
      // LOAD SLEEP FROM
      if (sF) {
        setSleepFrom(new Date(sF))
      } else {
        const SF = defaultSleepInfo().from
        setSleepFrom(SF)
        const SFString = SF.toString()
        await AsyncStorage.setItem('sleepFrom', SFString)
      }
      // LOAD SLEEP TO
      if (sT) {
        setSleepTo(new Date(sT))
      } else {
        const ST = defaultSleepInfo().to
        setSleepTo(ST)
        const STString = ST.toString()
        await AsyncStorage.setItem('sleepTo', STString)
      }
      // LOAD SUBSCRIPTIONS
      if (sub) {
        const parsedSubscriptions = JSON.parse(sub)
        if (u) {
          const parsedUser = JSON.parse(u)
          const server2 = fetchAPI(parsedUser._id)
          server2.query({
            query: getSubscriptions,
            variables: {
              userId: parsedUser._id
            }
          })
            .then(async res => {
              if (res.data.subscription.findByUserId) {
                const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
                  if (a.channelName < b.channelName) { return -1; }
                  if (a.channelName > b.channelName) { return 1; }
                  return 0;
                })
                setSubscriptions(sortedSubs)
                const stringSub = JSON.stringify(sortedSubs)
                await AsyncStorage.setItem('subscriptions', stringSub)
              } else {
                setSubscriptions(parsedSubscriptions)
              }
            })
            .catch(res => {
              // no message needed here
              // No internet connection, use existing subscription categories
              setSubscriptions(parsedSubscriptions)
            })
        } else {
          // no user, 
          setSubscriptions(parsedSubscriptions)
        }
      } else {
        const stringSub = JSON.stringify(subscriptions)
        await AsyncStorage.setItem('subscriptions', stringSub)
      }
      // LOAD CUES
      if (sC) {
        await loadNewChannelCues()
      } else {
        const custom: any = {}
        let allCues: any = {}
        allCues['local'] = [...defaultCues]
        const stringSC = JSON.stringify(allCues)
        await AsyncStorage.setItem('cues', stringSC)
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCues(allCues)
        setCustomCategories(customC)
        // START ANIMATION
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      }
      // OPEN WALKTHROUGH IF FIRST TIME LOAD
      // if (!init && dimensions.window.width >= 1024) {
      //   // openModal('Calendar')
      // }
      // HANDLE PROFILE
      if (u) {
        const parsedUser = JSON.parse(u)
        if (parsedUser.email) {
          if (init || saveData) {
            await saveDataInCloud()
          } else {
            loadDataFromCloud()
          }
        }
      }
      // INITIALISED FIRST TIME
      if (!init) {
        setInit(true)
      }
      // LOADED
      if (!sC) {
        setReLoading(false)
      }

    } catch (e) {
      console.log(e)
    }
  }, [fadeAnimation, init])

  // Move to profile page
  const handleLogin = useCallback(() => {
    const server = fetchAPI('')
    server.query({
      query: login,
      variables: {
        email: email.toLowerCase(),
        password
      }
    }).then(async (r: any) => {
      if (r.data.user.login.user && !r.data.user.login.error) {
        const u = r.data.user.login.user
        if (u.__typename) {
          delete u.__typename
        }

        const userId = u._id;

        OneSignal.setExternalUserId(userId);

        const sU = JSON.stringify(u)
        await AsyncStorage.setItem('user', sU)
        setShowLoginWindow(false)
        loadDataFromCloud()
      } else {
        const { error } = r.data.user.login;
        Alert(error);
      }
    }).catch(e => console.log(e))
  }, [email, password])

  // imp
  const loadDataFromCloud = useCallback(async () => {
    const u = await AsyncStorage.getItem('user')
    if (u) {
      const user = JSON.parse(u)
      const server = fetchAPI(user._id)
      // Get User info
      server.query({
        query: findUserById,
        variables: {
          id: user._id
        }
      }).then(async (res) => {
        const u = res.data.user.findById;
        if (u) {
          // not used
          setRandomShuffleFrequency(u.randomShuffleFrequency)
          setSleepFrom(new Date(u.sleepFrom))
          setSleepTo(new Date(u.sleepTo))
          // end of use
          await AsyncStorage.setItem('cueDraft', u.currentDraft)
          delete u.currentDraft;
          delete u.__typename
          const sU = JSON.stringify(u)
          await AsyncStorage.setItem('user', sU)
        }
      }).catch(err => console.log(err))
      // Get user cues
      server.query({
        query: getCuesFromCloud,
        variables: {
          userId: user._id
        }
      }).then(async (res) => {
        if (res.data.cue.getCuesFromCloud) {
          const allCues: any = {}
          res.data.cue.getCuesFromCloud.map((cue: any) => {
            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : "local"
            delete cue.__typename
            if (allCues[channelId]) {
              allCues[channelId].push({ ...cue })
            } else {
              allCues[channelId] = [{ ...cue }]
            }
          })
          const custom: any = {}
          if (allCues["local"]) {
            allCues['local'].map((item: any) => {
              if (item.customCategory !== "") {
                if (!custom[item.customCategory]) {
                  custom[item.customCategory] = 0
                }
              }
            })
          } else {
            allCues["local"] = []
          }
          const customC: any[] = []
          Object.keys(custom).map((item) => {
            customC.push(item)
          })
          customC.sort()
          setCues(allCues)
          setCustomCategories(customC)
          const stringCues = JSON.stringify(allCues)
          await AsyncStorage.setItem('cues', stringCues)
        }
      }).catch(err => console.log(err))
      // Get subscription information
      server.query({
        query: getSubscriptions,
        variables: {
          userId: user._id
        }
      })
        .then(async res => {
          if (res.data.subscription.findByUserId) {
            const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
              if (a.channelName < b.channelName) { return -1; }
              if (a.channelName > b.channelName) { return 1; }
              return 0;
            })
            setSubscriptions(sortedSubs)
            const stringSub = JSON.stringify(sortedSubs)
            await AsyncStorage.setItem('subscriptions', stringSub)

          }
        })
        .catch(err => console.log(err))
    }
  }, [])

  // imp
  const saveDataInCloud = useCallback(async () => {

    if (saveDataInProgress) return;

    setSaveDataInProgress(true);

    const draft = await AsyncStorage.getItem('cueDraft')
    const f: any = await AsyncStorage.getItem('randomShuffleFrequency')
    const sF: any = await AsyncStorage.getItem('sleepFrom')
    const sT: any = await AsyncStorage.getItem('sleepTo')
    const u: any = await AsyncStorage.getItem('user')
    const parsedUser = JSON.parse(u)
    const sC: any = await AsyncStorage.getItem('cues')
    const parsedCues = JSON.parse(sC)
    const sub: any = await AsyncStorage.getItem('subscriptions')
    const parsedSubscriptions = JSON.parse(sub)

    const allCuesToSave: any[] = []
    const allCues: any[] = []

    if (parsedCues !== {}) {
      Object.keys(parsedCues).map((key) => {
        parsedCues[key].map((cue: any) => {
          const cueInput = {
            ...cue,
            _id: cue._id.toString(),
            color: cue.color.toString(),
            date: (new Date(cue.date)).toISOString(),
            gradeWeight: cue.submission ? cue.gradeWeight.toString() : undefined,
            endPlayAt: cue.endPlayAt && cue.endPlayAt !== '' ? (new Date(cue.endPlayAt)).toISOString() : '',
            allowedAttempts: (cue.allowedAttempts && cue.allowedAttempts !== null) ? cue.allowedAttempts.toString() : null
          }
          allCuesToSave.push({ ...cueInput })
          // Deleting these because they should not be changed ...
          // but dont delete if it is the person who has made the cue 
          // -> because those channel Cue changes are going to be propagated
          delete cueInput.score;
          // delete cueInput.deadline;
          delete cueInput.graded;
          delete cueInput.submittedAt;
          // delete cueInput.gradeWeight;
          // delete cueInput.submission;
          delete cueInput.comment;

          // this change is propagated only when the user actively changes folder structure...
          delete cueInput.folderId;

          delete cueInput.unreadThreads;
          // delete cueInput.createdBy;
          // delete cueInput.original;
          delete cueInput.status;
          delete cueInput.channelName;
          delete cueInput.__typename;
          allCues.push(cueInput)
        })
      })
    }

    const server = fetchAPI('')
    // UPDATE CUE CONFIG
    server.mutate({
      mutation: saveConfigToCloud,
      variables: {
        randomShuffleFrequency: f,
        sleepFrom: sF,
        sleepTo: sT,
        currentDraft: draft ? draft : '',
        subscriptions: parsedSubscriptions,
        userId: parsedUser._id
      }
    }).then(res => {
    }).catch(err => console.log(err))

    // UPDATE CUES
    server.mutate({
      mutation: saveCuesToCloud,
      variables: {
        userId: parsedUser._id,
        cues: allCues
      }
    }).then(async res => {
      if (res.data.cue.saveCuesToCloud) {
        const newIds: any = res.data.cue.saveCuesToCloud;
        const updatedCuesArray: any[] = []
        allCuesToSave.map((c: any) => {
          const id = c._id;
          const updatedItem = newIds.find((i: any) => {
            return id.toString().trim() === i.oldId.toString().trim()
          })
          if (updatedItem) {
            updatedCuesArray.push({
              ...c,
              _id: updatedItem.newId
            })
          } else {
            updatedCuesArray.push(c)
          }
        })
        const updatedCuesObj: any = {};
        updatedCuesArray.map((c: any) => {
          if (c.channelId && c.channelId !== '') {
            if (updatedCuesObj[c.channelId]) {
              updatedCuesObj[c.channelId].push(c)
            } else {
              updatedCuesObj[c.channelId] = [c]
            }
          } else {
            if (updatedCuesObj["local"]) {
              updatedCuesObj["local"].push(c)
            } else {
              updatedCuesObj["local"] = [c]
            }
          }
        });
        const updatedCues = JSON.stringify(updatedCuesObj)
        await AsyncStorage.setItem('cues', updatedCues)
        if (newIds.length !== 0) {
          setCues(updatedCuesObj)
        }
      }

      setSaveDataInProgress(false)

    }).catch(err => console.log(err))
  }, [cues])

  useEffect(() => {

    OneSignal.initialize("51db5230-f2f3-491a-a5b9-e4fba0f23c76", {
      notifyButton: {
        enable: false,
      },
      allowLocalhostAsSecureOrigin: true,
    });

    // Called when component is loaded
    loadData()
  }, [])

  const handleFilterChange = useCallback((choice) => {
    setPageNumber(0)
    fadeAnimation.setValue(0)
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start();
    setFilterChoice(choice)
  }, [fadeAnimation])

  const openModal = useCallback((type) => {
    setModalType(type)
    AsyncStorage.setItem('lastopened', type)
  }, [sheetRef, cues])

  const openCueFromCalendar = useCallback((channelId, _id, by) => {

    let cueKey = '';
    let cueIndex = 0;

    if (cues !== {}) {
      Object.keys(cues).map((key) => {
        cues[key].map((cue: any, index: number) => {
          if (cue._id === _id) {
            cueKey = key;
            cueIndex = index;
          }
        })
      })
    }

    setUpdateModalKey(cueKey)
    setUpdateModalIndex(cueIndex)
    setPageNumber(pageNumber)
    setChannelId(channelId)
    if (channelId !== '') {
      const sub = subscriptions.find((item: any) => {
        return item.channelId === channelId
      })
      if (sub) {
        setFilterChoice(sub.channelName)
        setChannelCreatedBy(sub.channelCreatedBy)
      }
    }
    setCreatedBy(by)
    setCueId(_id)
    openModal('Update')
    setShowHome(false)
  }, [subscriptions, cues])

  const openUpdate = useCallback((key, index, pageNumber, _id, by, channId) => {

    console.log("Open update")
    setUpdateModalKey(key)
    setUpdateModalIndex(index)
    setPageNumber(pageNumber)
    setChannelId(channId)
    if (channId !== '') {
      const sub = subscriptions.find((item: any) => {
        return item.channelId === channId
      })
      if (sub) {
        setFilterChoice(sub.channelName)
        setChannelCreatedBy(sub.channelCreatedBy)
      }
    }
    setCreatedBy(by)
    setCueId(_id)
    openModal('Update')
    setShowHome(false)
  }, [subscriptions])

  console.log("")

  const reloadCueListAfterUpdate = useCallback(async () => {
    const unparsedCues = await AsyncStorage.getItem('cues')
    const u = await AsyncStorage.getItem('user')
    if (unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
      const custom: any = {}
      setCues(allCues)
      if (allCues['local']) {
        allCues['local'].map((item: any) => {
          if (item.customCategory !== "") {
            if (!custom[item.customCategory]) {
              custom[item.customCategory] = 0
            }
          }
        })
        const customC: any[] = []
        Object.keys(custom).map((item) => {
          customC.push(item)
        })
        customC.sort()
        setCustomCategories(customC)
      }
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    }
    if (u) {
      const user = JSON.parse(u)
      if (user.email) {
        await saveDataInCloud()
      }
    }
  }, [])

  const forgotPassword = useCallback(() => {

    const server = fetchAPI('')
    server.mutate({
      mutation: resetPassword,
      variables: {
        email
      }
    }).then(res => {
      if (res.data && res.data.user.resetPassword) {
        Alert(weHaveEmailedPasswordAlert)
        setShowForgotPassword(false)
      } else {
        Alert(invalidCredentialsAlert);
      }
    })
  }, [email])

  const refreshSubscriptions = async () => {
    const u = await AsyncStorage.getItem('user')

    if (u) {
      const parsedUser = JSON.parse(u)
      const server = fetchAPI(parsedUser._id)
      server.query({
        query: getSubscriptions,
        variables: {
          userId: parsedUser._id
        }
      })
        .then(async res => {
          if (res.data.subscription.findByUserId) {
            const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
              if (a.channelName < b.channelName) { return -1; }
              if (a.channelName > b.channelName) { return 1; }
              return 0;
            })
            setSubscriptions(sortedSubs)
            const stringSub = JSON.stringify(sortedSubs)
            await AsyncStorage.setItem('subscriptions', stringSub)
          }
        })
        .catch(e => {
          alert("Could not refresh Subscriptions")
        })
    }

  }

  const markCueAsRead = useCallback(async () => {

    let subCues: any = {};
    try {
      const value = await AsyncStorage.getItem("cues");
      if (value) {
        subCues = JSON.parse(value);
      }
    } catch (e) { }
    if (subCues[updateModalKey].length === 0) {
      return;
    }

    const unmodified = subCues ? subCues[updateModalKey][updateModalIndex] : {};

    if (!unmodified) return;

    const modified = {
      ...unmodified,
      status: "read"
    }

    subCues[updateModalKey][updateModalIndex] = modified

    const stringifiedCues = JSON.stringify(subCues);
    await AsyncStorage.setItem("cues", stringifiedCues);
    reloadCueListAfterUpdate();

  }, [cues, updateModalKey, updateModalIndex])

  const closeModal = useCallback(async () => {

    // Mark as read
    if (modalType === 'Update') {
      await markCueAsRead()
    }

    setCueId('')
    // setModalType('')
    setShowHome(true)
    setCreatedBy('')
    setChannelFilterChoice('All')
    if (modalType === 'Create' || modalType === 'Update') {
      // fadeAnimation.setValue(0)
      if (modalType === 'Update' && filterChoice === 'All-Channels') {
        setChannelId('')
      }
    }
    setOption('To Do')
    loadData(true)
  }, [sheetRef, fadeAnimation, modalType, filterChoice])

  const modalContent = modalType === 'ChannelSettings' ? <ChannelSettings
    channelId={channelId}
    refreshSubscriptions={refreshSubscriptions}
    closeModal={() => {
      setShowHome(true)
      closeModal()
    }}
  /> :
    (modalType === 'Create' ? <Create
      key={JSON.stringify(customCategories)}
      customCategories={customCategories}
      closeModal={() => {
        closeModal()
        setPageNumber(0)
      }}
    />
      :
      (modalType === 'Update' ? <Update
        key={cueId.toString()}
        customCategories={customCategories}
        cue={cues[updateModalKey][updateModalIndex]}
        cueIndex={updateModalIndex}
        cueKey={updateModalKey}
        closeModal={() => closeModal()}
        cueId={cueId}
        createdBy={createdBy}
        channelId={channelId}
        filterChoice={filterChoice}
        channelCreatedBy={channelCreatedBy}
        channelCues={cues[channelId]}
        reloadCueListAfterUpdate={() => reloadCueListAfterUpdate()}
        reopenUpdateWindow={reopenUpdateWindow}
        target={target}
        openCue={(cueId: string) => openCueFromCalendar(channelId, cueId, channelCreatedBy)}
        refreshCues={loadNewChannelCues}
      />
        :
        (modalType === 'Walkthrough' ? <Walkthrough
        />
          : (
            modalType === 'Channels' ? <Channels
              closeModal={() => {
                setShowHome(true)
                closeModal()
              }}
              refreshSubscriptions={refreshSubscriptions}
            /> : (
              modalType === 'Discussion' ? <Discussion
                closeModal={() => closeModal()}
                channelId={channelId}
                filterChoice={filterChoice}
                channelCreatedBy={channelCreatedBy}
              // refreshUnreadDiscussionCount={() => refreshUnreadDiscussionCount()}
              />
                : (
                  modalType === 'Subscribers' ? <Subscribers
                    closeModal={() => closeModal()}
                    channelId={channelId}
                    channelCreatedBy={channelCreatedBy}
                    filterChoice={filterChoice}
                    refreshUnreadMessagesCount={() => refreshUnreadMessagesCount()}
                  /> :
                    (
                      modalType === 'Profile' ? <Profile
                        closeModal={() => closeModal()}
                        saveDataInCloud={async () => await saveDataInCloud()}
                        reOpenProfile={() => {
                          setModalType('')
                          openModal('Profile')
                        }}
                        reloadData={() => {
                          loadData()
                          openModal('Walkthrough')
                        }}
                      /> :
                        (
                          modalType === 'Grades' ? <Grades
                            closeModal={() => closeModal()}
                            channelId={channelId}
                            channelCreatedBy={channelCreatedBy}
                            filterChoice={filterChoice}
                            openCueFromGrades={(cueId: string) => openCueFromCalendar(channelId, cueId, channelCreatedBy)}
                          />
                            : (
                              modalType === 'Calendar' ? <Calendar
                                cues={cues}
                                subscriptions={subscriptions}
                                openCueFromCalendar={openCueFromCalendar} />
                                : (
                                  modalType === 'Meeting' ? <Meeting
                                    channelId={channelId}
                                    channelName={filterChoice}
                                    channelCreatedBy={channelCreatedBy}
                                    refreshMeetingStatus={refreshMeetingStatus}
                                    closeModal={() => closeModal()}
                                    filterChoice={filterChoice}
                                  // refreshUnreadDiscussionCount={() => refreshUnreadDiscussionCount()}
                                  />
                                    : null
                                )
                            )
                        )
                    )
                )
            )
          )
        )
      )
    )

  const cuesArray: any[] = []
  let filteredCues: any[] = []
  if (cues !== {}) {
    Object.keys(cues).map((key) => {
      cues[key].map((cue: any, index: number) => {
        cuesArray.push({
          ...cue,
          key,
          index
        })
      })
    })
  }

  // // Filter if cues are inactive
  // const removeInactiveCues = cuesArray.filter((cue: any) => {
  //   return cue.active
  // })

  const cuesCopy = cuesArray.sort((a: any, b: any) => {
    if (a.color < b.color) {
      return -1;
    }
    if (a.color > b.color) {
      return 1;
    }
    return 0;
  })

  // if (filterChoice === 'All') {
  //   filteredCues = cuesCopy
  // } else if (filterChoice === 'MyCues') {
  //   filteredCues = cuesCopy.filter((item) => {
  //     return !item.channelId || item.channelId === ''
  //   })
  // } else if (filterChoice === 'All-Channels') {
  //   filteredCues = cuesCopy.filter((item) => {
  //     return item.channelId && item.channeId !== ''
  //   })
  // } else if (channelId !== '') {
  //   filteredCues = cuesCopy.filter((item) => {
  //     return item.channelName === filterChoice
  //   })
  // } else {
  //   filteredCues = cuesCopy.filter((item) => {
  //     return item.customCategory === filterChoice
  //   })
  // }

  let dateFilteredCues: any[] = []
  if (filterStart && filterEnd) {
    dateFilteredCues = cuesCopy.filter((item) => {
      const date = new Date(item.date)
      return date >= filterStart && date <= filterEnd
    })

  } else {
    dateFilteredCues = cuesCopy
  }

  if (!init) {
    return null;
  }

  const alertText = PreferredLanguageText('savedLocally');

  console.log("Show Home", showHome);
  console.log("Option", option);

  return (
    <View style={styles(channelId).container} key={showHome.toString() + option.toString()}>
      {
        showLoginWindow ? <View style={{
          width: '100%',
          height: '100%',
          flex: 1,
          position: 'absolute',
          zIndex: 50,
          backgroundColor: 'rgba(16,16,16, 0.7)'
        }}
        >
          <View style={{
            position: 'absolute',
            zIndex: 525,
            display: 'flex',
            alignSelf: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            width: dimensions.window.width < 1024 ? '100%' : '100%',
            height: dimensions.window.width < 1024 ? '100%' : '100%',
            borderRadius: dimensions.window.width < 1024 ? 0 : 0,
            marginTop: dimensions.window.width < 1024 ? 0 : 0,
            padding: 40
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', paddingBottom: 50 }}>
              <Image
                source={logo}
                style={{
                  width: dimensions.window.height * 0.16 * 0.53456,
                  height: dimensions.window.height * 0.16 * 0.2
                }}
                resizeMode={'contain'}
              />
            </View>
            {/* <Text style={{ fontSize: 20, color: '#1A2036', fontFamily: 'inter', paddingBottom: 15, maxWidth: 500, textAlign: 'center' }}>
              {
                showForgotPassword ? '' : PreferredLanguageText('login')
              }
            </Text> */}
            <Text style={{ fontSize: 15, color: '#50566B', fontFamily: 'overpass', paddingBottom: 30, textAlign: 'center' }}>
              {
                showForgotPassword ? PreferredLanguageText('temporaryPassword') : PreferredLanguageText('continueLeftOff')
              }
            </Text>
            <View style={{
              maxWidth: 400,
              width: '100%',
              backgroundColor: 'white',
              justifyContent: 'center',
              alignSelf: 'center'
            }}>
              <Text style={{ color: '#1A2036', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
                {PreferredLanguageText('email')}
              </Text>
              <TextInput
                value={email}
                placeholder={''}
                onChangeText={(val: any) => setEmail(val)}
                placeholderTextColor={'#50566B'}
                errorText={emailValidError}
              />
              {
                showForgotPassword ? null :
                  <View>
                    <Text style={{ color: '#1A2036', fontSize: 14, paddingBottom: 5 }}>
                      {PreferredLanguageText('password')}
                    </Text>
                    <TextInput
                      secureTextEntry={true}
                      value={password}
                      placeholder={''}
                      onChangeText={(val: any) => setPassword(val)}
                      placeholderTextColor={'#50566B'}
                    />
                  </View>
              }
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: 10,
                  paddingTop: 40
                }}>
                <TouchableOpacity
                  disabled={isSubmitDisabled}
                  onPress={() => {
                    if (showForgotPassword) {
                      forgotPassword()
                    } else {
                      handleLogin()
                    }
                  }}
                  style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                  }}>
                  <Text style={{
                    textAlign: 'center',
                    lineHeight: 35,
                    color: 'white',
                    fontSize: 12,
                    backgroundColor: '#5469D4',
                    paddingHorizontal: 20,
                    fontFamily: 'inter',
                    height: 35,
                    // width: 180,
                    width: 175,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                  }}>
                    {
                      showForgotPassword ? PreferredLanguageText('reset') : PreferredLanguageText('login')
                    }
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowForgotPassword(!showForgotPassword)}
                  style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 15,
                    width: '100%', justifyContent: 'center', flexDirection: 'row'
                  }}>
                  <Text style={{
                    color: '#5469D4',
                    width: 175,
                    borderWidth: 1,
                    borderRadius: 15,
                    borderColor: '#5469D4',
                    backgroundColor: '#fff',
                    fontSize: 12,
                    textAlign: 'center',
                    lineHeight: 35,
                    paddingHorizontal: 20,
                    fontFamily: 'inter',
                    height: 35,
                    // width: 200,
                    textTransform: 'uppercase'
                  }}>
                    {
                      showForgotPassword ? PreferredLanguageText('back') : PreferredLanguageText('forgotPassword')
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 5, paddingBottom: 5, marginTop: 20 }}>
              <LanguageSelect />
            </View>
          </View>
        </View> : null
      }
      {
        showHome && !showLoginWindow ? <View
          key={menuCollapsed.toString()}
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            position: 'absolute',
            // overflow: 'scroll',
            zIndex: 50,
            backgroundColor: '#fff'
          }}
        >
          <View
            key={option}
            style={{
              position: 'absolute',
              zIndex: 525,
              display: 'flex',
              alignSelf: 'center',
              // justifyContent: 'center',
              backgroundColor: 'white',
              width: dimensions.window.width < 1024 ? '100%' : '100%',
              height: dimensions.window.width < 1024 ? '100%' : '100%',
              borderRadius: dimensions.window.width < 1024 ? 0 : 0,
              marginTop: dimensions.window.width < 1024 ? 0 : 0,
              // paddingVertical: 20
            }}>

            {
              reLoading ?
                <View style={[styles(channelId).activityContainer, styles(channelId).horizontal]}>
                  <ActivityIndicator color={'#50566B'} />
                </View> :
                <Dashboard
                  setOption={(op: any) => setOption(op)}
                  option={option}
                  options={options}
                  refreshSubscriptions={refreshSubscriptions}
                  hideHome={() => {
                    setShowHome(false)
                    loadData()
                  }}
                  closeModal={() => {
                    setShowHome(true)
                    closeModal()
                  }}
                  saveDataInCloud={async () => await saveDataInCloud()}
                  reOpenProfile={() => {
                    setModalType('')
                    openModal('Profile')
                  }}
                  reloadData={() => {
                    loadDataFromCloud()
                  }}
                  cues={dateFilteredCues}
                  handleFilterChange={(choice: any) => handleFilterChange(choice)}
                  setChannelId={(id: string) => setChannelId(id)}
                  setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
                  setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
                  subscriptions={subscriptions}
                  openDiscussion={() => openModal('Discussion')}
                  openSubscribers={() => openModal('Subscribers')}
                  openGrades={() => openModal('Grades')}
                  openMeeting={() => openModal('Meeting')}
                  openChannelSettings={() => openModal('ChannelSettings')}
                  openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) => openUpdate(index, key, pageNumber, _id, by, cId)}
                  calendarCues={cues}
                  openCueFromCalendar={openCueFromCalendar}
                  key={option.toString() + showHome.toString()}
                  openDiscussionFromActivity={(channelId: string) => {
                    setOption('Classroom')
                    setLoadDiscussionForChannelId(channelId)
                  }}
                  openChannelFromActivity={(channelId: string) => {
                    setOption('Classroom')
                    setOpenChannelId(channelId)
                  }}
                  openQAFromSearch={(channelId: any, cueId: string) => {

                    const subscription = subscriptions.find((sub: any) => {
                      return sub.channelId === channelId;
                    })

                    if (subscription) {
                      openCueFromCalendar(channelId, cueId, subscription.channelCreatedBy)
                      setTarget('Q&A')
                    }

                  }}
                  openQAFromActivity={(channelId: any, cueId: string, by: string) => {
                    openCueFromCalendar(channelId, cueId, by)
                    setTarget('Q&A')
                  }}
                  openDiscussionFromSearch={(channelId: any) => {
                    // Find channel Created By from subscriptions
                    setOption('Classroom')
                  }}

                  openClassroom={(channelId: any) => {
                    // Find channel Created By from subscriptions
                    const match = subscriptions.filter((sub: any) => {
                      return sub.channelId === channelId
                    })
                    if (match && match.length !== 0) {
                      const createdBy = match[0].channelCreatedBy
                      setChannelId(channelId);
                      setChannelCreatedBy(createdBy);
                      setCreatedBy(createdBy)
                      openModal('Meeting')
                      setShowHome(false);
                    }
                  }}
                  loadDiscussionForChannelId={loadDiscussionForChannelId}
                  setLoadDiscussionForChannelId={setLoadDiscussionForChannelId}
                  openChannelId={openChannelId}
                  setOpenChannelId={setOpenChannelId}
                />
            }
          </View>
        </View> : null
      }
      <View
        key={menuCollapsed.toString()}
        style={{
          flexDirection: 'column',
          flex: 1,
          height: dimensions.window.height,
          width: '100%'
        }}
      >
        {
          !showHome ? null :
            // VERTICAL BAR
            <View style={{
              height: 61,
              borderBottomWidth: 1,
              borderColor: '#E3E8EE'
            }}>
              <VerticalBar
                menuCollapsed={menuCollapsed}
                hideMenu={() => setMenuCollapsed(false)}
                closeModal={() => closeModal()}
                showHome={() => {
                  setShowHome(true)
                  setMenuCollapsed(true)
                }}
                filterChoice={filterChoice}
                handleFilterChange={(choice: any) => handleFilterChange(choice)}
                key={Math.random()}
                customCategories={customCategories}
                subscriptions={subscriptions}
                setChannelId={(id: string) => setChannelId(id)}
                setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
                setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
                channelFilterChoice={channelFilterChoice}
                openChannels={() => openModal('Channels')}
                cues={dateFilteredCues}
                channelId={channelId}
                channelCreatedBy={channelCreatedBy}
                loadData={() => loadData()}
                openDiscussion={() => openModal('Discussion')}
                openSubscribers={() => openModal('Subscribers')}
                openGrades={() => openModal('Grades')}
                unsubscribe={() => unsubscribeChannel()}
                openWalkthrough={() => openModal('Walkthrough')}
                deleteChannel={() => deleteChannel()}
                openCalendar={() => openModal('Calendar')}
                openMeeting={() => openModal('Meeting')}
                openChannelSettings={() => openModal('ChannelSettings')}
                unreadDiscussionThreads={unreadDiscussionThreads}
                unreadMessages={unreadMessages}
                meetingOn={meetingOn}
              />
            </View>
          // FULL MENU
          // <View style={{
          //   width: dimensions.window.width,
          //   height: dimensions.window.height,
          //   borderColor: '#E3E8EE',
          //   backgroundColor: '#f7fafc',
          // }}>
          //   <View style={{
          //     backgroundColor: '#f7fafc',
          //     width: dimensions.window.width,
          //     height: dimensions.window.height - 30,
          //     maxWidth: 1000, alignSelf: 'center'
          //   }}>
          //     <BottomBar
          //       cues={dateFilteredCues}
          //       openWalkthrough={() => openModal('Walkthrough')}
          //       openCalendar={() => openModal('Calendar')}
          //       openCreate={() => openModal('Create')}
          //       openChannels={() => openModal('Channels')}
          //       openProfile={() => openModal('Profile')}
          //       closeModal={() => closeModal()}
          //       showHome={() => {
          //         setShowHome(true)
          //         setMenuCollapsed(true)
          //       }}
          //       hideMenu={() => setMenuCollapsed(true)}
          //       showMenu={() => setMenuCollapsed(false)}
          //       filterChoice={filterChoice}
          //       handleFilterChange={(choice: any) => handleFilterChange(choice)}
          //       key={Math.random()}
          //       customCategories={customCategories}
          //       subscriptions={subscriptions}
          //       setChannelId={(id: string) => setChannelId(id)}
          //       setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
          //       setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
          //       channelFilterChoice={channelFilterChoice}
          //       filterStart={filterStart}
          //       filterEnd={filterEnd}
          //       setFilterStart={(s: any) => setFilterStart(s)}
          //       setFilterEnd={(e: any) => setFilterEnd(e)}
          //       channelId={channelId}
          //       channelCreatedBy={channelCreatedBy}
          //       loadData={() => loadData()}
          //       // setChannelFilterChoice={(choice: any) => setChannelFilterChoice(choice)}
          //       openDiscussion={() => openModal('Discussion')}
          //       openSubscribers={() => openModal('Subscribers')}
          //       openGrades={() => openModal('Grades')}
          //       unsubscribe={() => unsubscribeChannel()}
          //       deleteChannel={() => deleteChannel()}
          //       openMeeting={() => {
          //         openModal('Meeting')
          //         setMenuCollapsed(true)
          //       }}
          //       openChannelSettings={() => {
          //         openModal('ChannelSettings')
          //         setMenuCollapsed(true)
          //       }}
          //       unreadDiscussionThreads={unreadDiscussionThreads}
          //       unreadMessages={unreadMessages}
          //       meetingOn={meetingOn}
          //     />
          //     {
          //       reLoading ? <View style={[styles(channelId).activityContainer, styles(channelId).horizontal]}>
          //         <ActivityIndicator color={'#50566B'} />
          //       </View>
          //         : <View style={[styles(channelId).activityContainer, styles(channelId).horizontal]}>
          //           <CardsList
          //             pageNumber={pageNumber}
          //             fadeAnimation={fadeAnimation}
          //             key={JSON.stringify(filterChoice) + JSON.stringify(channelId) + JSON.stringify(dateFilteredCues) + JSON.stringify(channelFilterChoice)}
          //             cues={dateFilteredCues}
          //             channelId={channelId}
          //             createdBy={channelCreatedBy}
          //             filterChoice={filterChoice}
          //             openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) => {
          //               openUpdate(index, key, pageNumber, _id, by, cId)
          //               setMenuCollapsed(true)
          //             }}
          //             channelFilterChoice={channelFilterChoice}
          //             subscriptions={subscriptions}
          //           />
          //         </View>
          //     }
          //   </View>
          // </View >
        }
        {
          (!menuCollapsed && dimensions.window.width < 1024) || showHome ? null :
            (modalType === '' ? <View
              style={{
                width: dimensions.window.width < 1024 ? 0 : dimensions.window.width,
                marginTop: dimensions.window.width < 1024 ? (menuCollapsed ? 60 : 0) : 0,
                height: (menuCollapsed ? dimensions.window.height - 60 : 0),
                // paddingHorizontal: dimensions.window.width < 1024 ? 0 : 30,
                paddingTop: 10,
                // backgroundColor: '#f7fafc',
                backgroundColor: '#fff',
                position: dimensions.window.width < 1024 ? 'absolute' : 'relative'
              }}
            >
              {
                dimensions.window.width < 1024 ? null : <View style={{ flexDirection: 'column', flex: 1, width: '100%', justifyContent: 'center', backgroundColor: '#fff' }}>
                  <Text style={{ fontSize: 20, color: '##1A2036', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff' }}>
                    Select cue to view.
                  </Text>
                </View>
              }
            </View>
              :
              <View
                key={menuCollapsed.toString()}
                style={{
                  width: (dimensions.window.width),
                  alignSelf: 'center',
                  height: (dimensions.window.height),
                  // paddingHorizontal: dimensions.window.width < 1024 ? 0 : 30,
                  paddingTop: 0,
                  backgroundColor: '#fff',
                  position: 'relative'
                }}>
                {
                  // dimensions.window.width < 1024 && !menuCollapsed ? null :
                  <View style={{
                    // flex: 1,
                    height: (menuCollapsed ? (dimensions.window.height) : 0),
                    backgroundColor: 'white',
                    paddingHorizontal: dimensions.window.width < 1024 ? 20 : 0,
                    width: dimensions.window.width,
                    // marginRight: 0,
                    alignSelf: 'center',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    maxWidth: modalType === 'Create' || modalType === 'Update' ? 1000 : dimensions.window.width,
                    overflow: 'hidden'
                  }}>
                    {modalContent}
                  </View>
                }
              </View>)
        }
      </View>
      {
        showHome && !reLoading && option === 'Classroom' ?
          <TouchableOpacity
            onPress={() => {
              setCueId('')
              setModalType('')
              setCreatedBy('')
              setChannelFilterChoice('All')
              if (modalType === 'Create' || modalType === 'Update') {
                fadeAnimation.setValue(0)
                if (modalType === 'Update' && filterChoice === 'All-Channels') {
                  setChannelId('')
                }
              }
              loadData(true)
              openModal('Create')
              setShowHome(false)
              setMenuCollapsed(true)
            }}
            style={{
              position: 'absolute',
              marginRight: Dimensions.get('window').width >= 1100 ? (((Dimensions.get('window').width - 1100) / 2) - 25) : 20,
              marginBottom: Dimensions.get('window').width < 1024 ? 85 : 25,
              zIndex: showLoginWindow ? 40 : 600,
              right: 0,
              justifyContent: 'center',
              bottom: 0,
              width: 54, height: 54, borderRadius: 27, backgroundColor: '#5469D4',
              borderColor: '#E3E8EE',
              borderWidth: 1
            }}
          >
            <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
              <Ionicons name='pencil-outline' size={25} />
            </Text>
          </TouchableOpacity> : null
      }
      {
        Dimensions.get('window').width < 1024 && showHome ?
          <View style={{
            position: 'absolute',
            zIndex: showLoginWindow ? 40 : 1000,
            backgroundColor: '#f7fafc',
            borderColor: '#E3E8EE',
            borderTopWidth: 2,
            alignSelf: 'flex-end',
            width: '100%',
            paddingTop: 10,
            paddingBottom: 10,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 40,
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#f7fafc',
                width: '25%'
              }}
              onPress={() => setOption('To Do')}
            >
              <Text style={{ textAlign: 'center' }}>
                <Ionicons name='list-outline' size={21} color={option === 'To Do' ? '#5469D4' : '#1A2036'} />
              </Text>
              <Text style={{ fontSize: 11, color: option === 'To Do' ? '#5469D4' : '#1A2036', paddingTop: 6, textAlign: 'center' }}>
                Agenda
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#f7fafc',
                width: '25%'
              }}
              onPress={() => setOption('Classroom')}
            >
              <Text style={{ textAlign: 'center' }}>
                <Ionicons name='school-outline' size={22} color={option === 'Classroom' ? '#5469D4' : '#1A2036'} />
              </Text>
              <Text style={{ fontSize: 11, color: option === 'Classroom' ? '#5469D4' : '#1A2036', paddingTop: 5, textAlign: 'center' }}>
                Workspace
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#f7fafc',
                width: '25%'
              }}
              onPress={() => setOption('Performance')}
            >
              <Text style={{ textAlign: 'center' }}>
                <Ionicons name='speedometer-outline' size={22} color={option === 'Performance' ? '#5469D4' : '#1A2036'} />
              </Text>
              <Text style={{ fontSize: 11, color: option === 'Performance' ? '#5469D4' : '#1A2036', paddingTop: 5, textAlign: 'center' }}>
                Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#f7fafc',
                //marginHorizontal: 20,
                width: '25%'
              }}
              onPress={() => setOption('Inbox')}
            >
              <Text style={{ textAlign: 'center' }}>
                <Ionicons name='chatbubble-outline' size={21} color={option === 'Inbox' ? '#5469D4' : '#1A2036'} />
              </Text>
              <Text style={{ fontSize: 11, color: option === 'Inbox' ? '#5469D4' : '#1A2036', paddingTop: 6, textAlign: 'center' }}>
                Inbox
              </Text>
            </TouchableOpacity>
          </View> : null
      }
      {/* </View>
      </View> */}
    </View>
  );
}

export default Home

const styles = (channelId: string) => StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    height: "100%",
  },
  activityContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#eeeeef',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    height: '100%',
    // height: Dimensions.get('window').height - 60,
    width: '100%',
    // maxWidth: 1000,
    justifyContent: "center",
    backgroundColor: '#f7fafc'
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  input: {
    width: '100%',
    borderBottomColor: '#f7fafc',
    borderBottomWidth: 1,
    fontSize: 14,
    paddingTop: 13,
    paddingBottom: 13,
    marginTop: 5,
    marginBottom: 20
  }
});