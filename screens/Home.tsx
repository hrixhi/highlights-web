import React, { useState, useCallback, useRef, ReactText, useEffect } from 'react';
import { StyleSheet, Keyboard, Animated, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import BottomBar from '../components/BottomBar';
import CardsList from '../components/CardsList';
import { View } from '../components/Themed';
import TopBar from '../components/TopBar';
import BottomSheet from 'reanimated-bottom-sheet';
import Menu from '../components/Menu'
import Create from '../components/Create';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Update from '../components/Update';
import Constants from 'expo-constants';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
import { defaultCues, defaultRandomShuffleFrequency, defaultSleepInfo } from '../helpers/DefaultData'
import Walkthrough from '../components/Walkthrough';
import * as Notifications from 'expo-notifications';
import { getNextDate, duringSleep } from '../helpers/DateParser';
import Channels from '../components/Channels';
import { fetchAPI } from '../graphql/FetchAPI';
import { createUser, getSubscriptions, getCues, unsubscribe } from '../graphql/QueriesAndMutations';
import { htmlStringParser } from '../helpers/HTMLParser';
import Discussion from '../components/Discussion';
import Subscribers from '../components/Subscribers';
import { ScrollView } from 'react-native-gesture-handler';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

  const [filterChoice, setFilterChoice] = useState('All')
  const [customCategories, setCustomCategories] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [cues, setCues] = useState<any>({})
  const [sleepFrom, setSleepFrom] = useState(new Date())
  const [sleepTo, setSleepTo] = useState(new Date())
  const [firstOpened, setFirstOpened] = useState(new Date())
  const [randomShuffleFrequency, setRandomShuffleFrequency] = useState('1-D')
  const [reLoading, setReLoading] = useState(true)
  const [showShadow, setShowShadow] = useState(false)
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
  const responseListener: any = useRef();

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

  const notificationScheduler = useCallback(async () => {

    if (Platform.OS === 'web') {
      return
    }

    try {

      // Clean out all already scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync()

      // This is the object where we are going to collect all notifications that can be scheduled
      // between two time points A and B 
      const notificationRequests: any[] = []

      // Get notification permission
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        // permission granted
      } else {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true
          },
        });
        const settings = await Notifications.getPermissionsAsync();
        if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
          // permission granted
        } else {
          // leave scheduler
          return;
        }
      }

      // Setting notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (n) => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true
          }
        },
        handleError: (err) => console.log(err),
        handleSuccess: (res) => loadData()
      })

      // for when user taps on a notification   
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        loadData()
      });

      // for the ones that are on shuffle
      const shuffledCues: any[] = []
      const unShuffledCues: any[] = []

      // choose two dates - now (A) & now + 1 month (B) for timed cues
      const A = new Date()
      const B = new Date()
      B.setMonth(B.getMonth() + 1)

      // For sleep calculations
      let from = new Date(sleepFrom)
      let to = new Date(sleepTo)
      let a = from.getHours()
      let b = to.getHours()
      a += (from.getMinutes() / 60)
      b += (to.getMinutes() / 60)

      const cuesArray: any[] = []
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

      // First filter shuffled and unshuffled cues
      cuesArray.map((item: any) => {
        if (item.shuffle) {
          switch (item.color) {
            case 0:
              // ratio 3/25
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              break;
            case 1:
              // ratio 4/25
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              break;
            case 2:
              // ratio 5/25
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              break;
            case 3:
              // ratio 6/25
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              break;
            case 4:
              // ratio  7/25
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              shuffledCues.push(item)
              break;
            default:
              shuffledCues.push(item)
              break;
          }
        } else {
          unShuffledCues.push(item)
        }
      })

      // TIMED CUES
      for (let u = 0; u < unShuffledCues.length; u++) {
        let notifDate = new Date(unShuffledCues[u].date)
        if (unShuffledCues[u].frequency === "0") {
          // "Never" show highlight
          continue;
        }
        // Never need to consider more than 64 notification per cue
        let loopCheck = 0;
        while (notifDate < B) {

          if (unShuffledCues[u].endPlayAt && unShuffledCues[u].endPlayAt !== '') {
            const C = new Date(unShuffledCues[u].endPlayAt)
            if (notifDate > C) {
              break;
            }
          }

          if (notifDate < A) {
            notifDate = getNextDate(unShuffledCues[u].frequency, notifDate)
            continue
          }

          let n = notifDate.getHours()
          n += (notifDate.getMinutes() / 60)

          if (duringSleep(a, b, n)) {
            notifDate = getNextDate(unShuffledCues[u].frequency, notifDate)
            continue
          }

          loopCheck++
          if (loopCheck > 64) {
            // upto 50 valid notifications can be considered
            break;
          }

          const { title, subtitle } = htmlStringParser(unShuffledCues[u].cue)
          notificationRequests.push({
            content: {
              title,
              subtitle,
              sound: true
            },
            trigger: new Date(notifDate),
          })
          notifDate = getNextDate(unShuffledCues[u].frequency, notifDate)
        }
      }

      if (randomShuffleFrequency !== "0") {
        // SHUFFLE CUES
        let min = 0
        let max = shuffledCues.length
        let notifDate = new Date(firstOpened)
        // Set shuffle period to consider
        // B.setMonth(B.getMonth() - 2)
        let loopCheck = 0;
        let infiniteLoopCheck = 0;
        while (notifDate < B && infiniteLoopCheck < 10000) {

          infiniteLoopCheck++;
          let randomIndex = Math.floor(Math.random() * (max - min) + min)

          if (shuffledCues[randomIndex].endPlayAt && shuffledCues[randomIndex].endPlayAt !== '') {
            const C = new Date(shuffledCues[randomIndex].endPlayAt)
            if (notifDate > C) {
              // We want the same time, but different index
              // so no break here
              if (shuffledCues.length === 0) {
                break;
              } else {
                continue;
              }
            }
          }

          if (notifDate < A) {
            notifDate = getNextDate(randomShuffleFrequency, notifDate)
            continue
          }

          // If the time is between sleep hours, don't show it
          let n = notifDate.getHours()
          n += (notifDate.getMinutes() / 60)

          if (duringSleep(a, b, n)) {
            notifDate = getNextDate(randomShuffleFrequency, notifDate)
            continue
          }

          loopCheck++
          if (loopCheck > 64) {
            // upto 50 valid notifications can be considered
            break;
          }

          const { title, subtitle } = htmlStringParser(shuffledCues[randomIndex].cue)
          notificationRequests.push({
            content: {
              title,
              subtitle,
              sound: true
            },
            trigger: new Date(notifDate),
          })
          notifDate = getNextDate(randomShuffleFrequency, notifDate)
        }

      }

      const sortedRequests: any[] = notificationRequests.sort((a: any, b: any) => {
        return a.trigger - b.trigger
      })
      if (sortedRequests.length === 0) {
        // no requests to process
        return
      }

      let lastTriggerDate = new Date()
      lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 5)
      const iterateUpTo = sortedRequests.length >= 64 ? 63 : sortedRequests.length
      // iOS has a limit on scheduled notifications - 64 which is why we have to 
      // choose the first 64 notifications
      // After that make the user revisit the app again
      for (let i = 0; i < iterateUpTo; i++) {
        // Schedule notification
        await Notifications.scheduleNotificationAsync(sortedRequests[i])
        // The last notification in the scheduling queue has to be the one
        if (i === (iterateUpTo - 1)) {
          lastTriggerDate = new Date(sortedRequests[i].trigger)
          lastTriggerDate.setMinutes(lastTriggerDate.getMinutes() + 1)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Continue receiving notifications?',
              subtitle: 'Open Cues! It\'s been a while...',
              sound: true,
            },
            trigger: lastTriggerDate
          })
        }
      }

    } catch (e) {
      console.log(e)
    }

  }, [randomShuffleFrequency, sleepFrom, sleepTo, firstOpened, cues, responseListener])

  const loadCues = useCallback(async () => {
    let user = await AsyncStorage.getItem('user')
    const unparsedCues = await AsyncStorage.getItem('cues')
    if (user && unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
      const originalAllCues = JSON.parse(unparsedCues)
      const parsedUser = JSON.parse(user)
      const server = fetchAPI(parsedUser._id)
      server.query({
        query: getCues,
        variables: {
          userId: parsedUser._id
        }
      })
        .then(async res => {
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
                // Cue not in storage
                if (item.status === 'read' && originalAllCues[item.channelId]) {
                  // That means the channel is in storage, cue is not in storage
                  // which means it was deleted by the user.
                  // NOTE -- If originalAllCues[item.channelId] does not exist 
                  // but the status is read and cue exists,
                  // that means the channel was unsubscribed to
                  // and we want to bring back those cues
                  // so we get into the else statement below
                } else {
                  // New Cue
                  let cue: any = {}
                  cue = {
                    ...item,
                    original: item.cue
                  }
                  delete cue.__typename
                  if (allCues[cue.channelId]) {
                    allCues[cue.channelId].push(cue)
                  } else {
                    allCues[cue.channelId] = [cue]
                  }
                }
              } else {
                // Cue was found in storage
                // update its status
                allCues[item.channelId][index].status = item.status;
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
        })
        .catch(err => {
          Alert.alert("Unable to refresh channel cues.", "Check connection.")
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
        })
    }
  }, [])

  const unsubscribeChannel = useCallback(() => {
    Alert.alert(
      "Leave Channel",
      "Are you sure you want to unsubscribe from " + filterChoice + "?",
      [
        {
          text: "Cancel", style: "cancel"
        },
        {
          text: "Keep Content & Unsubscribe", onPress: async () => {
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
                  Alert.alert("Already unsubscribed.")
                }
              }).catch(err => {
                Alert.alert("Something went wrong.", "Check connection.")
              })
            }
          }
        },
        {
          text: "Erase Content & Unsubscribe", onPress: async () => {
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
                  Alert.alert("Already unsubscribed.")
                }
              }).catch(err => {
                Alert.alert("Something went wrong.", "Check connection.")
              })
            }
          }
        },
      ]
    );
  }, [channelId, filterChoice])

  const loadData = useCallback(async () => {

    setReLoading(true)
    try {

      const version = 'v0.5.1'
      const server = fetchAPI('')
      const fO = await AsyncStorage.getItem(version)

      // LOAD FIRST OPENED
      if (fO === undefined || fO === null) {
        try {
          await AsyncStorage.clear()
        } catch (e) {
        }
        const now = new Date()
        const fOString = now.toString()
        await AsyncStorage.setItem(version, fOString)
        setFirstOpened(new Date(now))
      } else {
        setFirstOpened(new Date(fO))
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
          dictionaries: [adjectives, colors, animals]
        });
        const displayName = uniqueNamesGenerator({
          dictionaries: [adjectives, colors, animals]
        });
        let experienceId = undefined;
        if (!Constants.manifest) {
          // Absence of the manifest means we're in bare workflow
          experienceId = '@username/example';
        }
        // const expoToken = await Notifications.getExpoPushTokenAsync({
        //   experienceId,
        // });
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
          server.query({
            query: getSubscriptions,
            variables: {
              userId: parsedUser._id
            }
          })
            .then(async res => {
              if (res.data.subscription.findByUserId) {
                setSubscriptions(res.data.subscription.findByUserId)
                const stringSub = JSON.stringify(res.data.subscription.findByUserId)
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
        loadCues()
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
        setCustomCategories(customC)
        // START ANIMATION
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      }
      // OPEN WALKTHROUGH IF FIRST TIME LOAD
      if (!fO) {
        openModal('Walkthrough')
      }
    } catch (e) {
      console.log(e)
    }

  }, [fadeAnimation])

  useEffect(() => {
    // Called when component is loaded
    loadData()
  }, [])

  useEffect(() => {
    if (!reLoading) {
      notificationScheduler()
    }
  }, [reLoading])

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
    // sheetRef.current.snapTo(0)
    setShowShadow(true)
  }, [sheetRef, cues])

  const openUpdate = useCallback((key, index, pageNumber, _id, by, channId) => {
    setUpdateModalKey(key)
    setUpdateModalIndex(index)
    setPageNumber(pageNumber)
    setCueId(_id)
    setChannelId(channId)
    setCreatedBy(by)
    openModal('Update')
  }, [filterChoice])

  const closeModal = useCallback(() => {
    setCueId('')
    // sheetRef.current.snapTo(2)
    setModalType('')
    setCreatedBy('')
    setChannelFilterChoice('All')
    setShowShadow(false)
    if (modalType === 'Create' || modalType === 'Update') {
      fadeAnimation.setValue(0)
      if (modalType === 'Update' && filterChoice === 'All-Channels') {
        setChannelId('')
      }
    }
    loadData()
  }, [sheetRef, fadeAnimation, modalType, filterChoice])

  const modalContent = modalType === 'Menu' ? <Menu
    sleepFrom={sleepFrom}
    sleepTo={sleepTo}
    randomShuffleFrequency={randomShuffleFrequency}
    setRandomShuffleFrequency={(option: any) => setRandomShuffleFrequency(option)}
    setSleepFrom={(date: any) => setSleepFrom(date)}
    setSleepTo={(date: any) => setSleepTo(date)}
  /> :
    (modalType === 'Create' ? <Create
      customCategories={customCategories}
      closeModal={() => {
        closeModal()
        setPageNumber(0)
      }} />
      :
      (modalType === 'Update' ? <Update
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
      />
        :
        (modalType === 'Walkthrough' ? <Walkthrough
        />
          : (
            modalType === 'Channels' ? <Channels
              closeModal={() => closeModal()}
            /> : (
                modalType === 'Discussion' ? <Discussion
                  closeModal={() => closeModal()}
                  channelId={channelId}
                  filterChoice={filterChoice}
                  channelCreatedBy={channelCreatedBy}
                />
                  : (
                    modalType === 'Subscribers' ? <Subscribers
                      closeModal={() => closeModal()}
                      channelId={channelId}
                      filterChoice={filterChoice}
                    /> :
                      null
                  )
              )
          )
        )
      )
    )

  const snapPoints: ReactText[] = modalType === 'Menu' ? ['55%', 0, 0] :
    (modalType === 'Create' ? ['90%', 0, 0] :
      (modalType === 'Update' ? ['90%', 0, 0] :
        (modalType === 'Walkthrough' ? ['85%', 0, 0] :
          (modalType === 'Channels' ? ['85%', 0, 0] :
            (modalType === 'Discussion' ? ['90%', 0, 0] :
              (modalType === 'Subscribers' ? ['90%', 0, 0] : [0, 0, 0])
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
  const cuesCopy = cuesArray.sort((a: any, b: any) => {
    if (a.color < b.color) {
      return -1;
    }
    if (a.color > b.color) {
      return 1;
    }
    return 0;
  })
  if (filterChoice === 'All') {
    filteredCues = cuesCopy.filter((item) => {
      return !item.channelId || item.channelId === ''
    })
  } else if (filterChoice === 'All-Channels') {
    filteredCues = cuesCopy.filter((item) => {
      return item.channelId && item.channeId !== ''
    })
  } else if (channelId !== '') {
    filteredCues = cuesCopy.filter((item) => {
      return item.channelName === filterChoice
    })
  } else {
    filteredCues = cuesCopy.filter((item) => {
      return item.customCategory === filterChoice
    })
  }

  return (
    <View style={styles.container}>
      <View style={{
        width: Dimensions.get('window').width * 0.3,
        height: Dimensions.get('window').height,
        flexDirection: 'column',
        backgroundColor: '#f4f4f4',
        paddingTop: 30,
        paddingLeft: 30
      }}>
        <TopBar
          key={JSON.stringify(channelFilterChoice) + JSON.stringify(filteredCues)}
          openChannels={() => openModal('Channels')}
          cues={filteredCues}
          filterChoice={filterChoice}
          channelId={channelId}
          channelFilterChoice={channelFilterChoice}
          setChannelFilterChoice={(choice: any) => setChannelFilterChoice(choice)}
          openDiscussion={() => openModal('Discussion')}
          openSubscribers={() => openModal('Subscribers')}
          unsubscribe={() => unsubscribeChannel()}
        />
        {
          reLoading ? <View style={[styles.activityContainer, styles.horizontal]}>
            <ActivityIndicator color={'#a6a2a2'} />
          </View>
            : <View style={[styles.activityContainer, styles.horizontal]}>
              <CardsList
                pageNumber={pageNumber}
                fadeAnimation={fadeAnimation}
                key={JSON.stringify(filterChoice) + JSON.stringify(channelId) + JSON.stringify(filteredCues) + JSON.stringify(channelFilterChoice)}
                cues={filteredCues}
                channelId={channelId}
                createdBy={channelCreatedBy}
                filterChoice={filterChoice}
                openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) => openUpdate(index, key, pageNumber, _id, by, cId)}
                channelFilterChoice={channelFilterChoice}
              />
            </View>
        }
        <BottomBar
          openMenu={() => openModal('Menu')}
          openCreate={() => openModal('Create')}
          openWalkthrough={() => openModal('Walkthrough')}
          filterChoice={filterChoice}
          handleFilterChange={(choice: any) => handleFilterChange(choice)}
          key={Math.random()}
          customCategories={customCategories}
          subscriptions={subscriptions}
          setChannelId={(id: string) => setChannelId(id)}
          setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
          setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
          openChannels={() => openModal('Channels')}
        />
      </View >
      <View style={{
        width: Dimensions.get('window').width * 0.7,
        height: Dimensions.get('window').height,
        paddingHorizontal: 30,
        paddingTop: 30,
        borderLeftWidth: 1,
        borderColor: '#f4f4f4',
        backgroundColor: '#f4f4f4'
      }}>
        {
          modalType === '' ? null : modalContent
        }
      </View>
    </View>
  );
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  activityContainer: {
    height: '70%',
    width: Dimensions.get('window').width * 0.3,
    justifyContent: "center",
    // borderRightWidth: 1,
    // borderLeftWidth: 1,
    // borderColor: '#eaeaea'
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around"
  }
});
