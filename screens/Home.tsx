import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Animated, ActivityIndicator, Alert, Dimensions, TextInput } from 'react-native';
import BottomBar from '../components/BottomBar';
import CardsList from '../components/CardsList';
import { Text, TouchableOpacity, View } from '../components/Themed';
import TopBar from '../components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import Menu from '../components/Menu'
import Create from '../components/Create';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Update from '../components/Update';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'
import { defaultCues, defaultRandomShuffleFrequency, defaultSleepInfo } from '../helpers/DefaultData'
import Walkthrough from '../components/Walkthrough';
import Channels from '../components/Channels';
import { fetchAPI } from '../graphql/FetchAPI';
import { createUser, getSubscriptions, getCues, unsubscribe, saveConfigToCloud, saveCuesToCloud, login, getCuesFromCloud, findUserById } from '../graphql/QueriesAndMutations';
import Discussion from '../components/Discussion';
import Subscribers from '../components/Subscribers';
import Profile from '../components/Profile';
import { validateEmail } from '../helpers/emailCheck';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

  const [filterChoice, setFilterChoice] = useState('All')
  const [customCategories, setCustomCategories] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [cues, setCues] = useState<any>({})
  const [sleepFrom, setSleepFrom] = useState(new Date())
  const [sleepTo, setSleepTo] = useState(new Date())
  const [randomShuffleFrequency, setRandomShuffleFrequency] = useState('1-D')
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
  const [init, setInit] = useState(false)
  const [showLoginWindow, setShowLoginWindow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

  const loadNewChannelCues = useCallback(async () => {
    let user = await AsyncStorage.getItem('user')
    const unparsedCues = await AsyncStorage.getItem('cues')
    if (user && unparsedCues) {
      const allCues = JSON.parse(unparsedCues)
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
          dictionaries: [adjectives, colors, animals]
        });
        const displayName = uniqueNamesGenerator({
          dictionaries: [adjectives, colors, animals]
        });
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
        loadNewChannelCues()
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
      if (!init && Dimensions.get('window').width >= 1024) {
        openModal('Create')
      }
      // HANDLE PROFILE
      if (u) {
        const parsedUser = JSON.parse(u)
        if (parsedUser.email) {
          if (!init) {
            loadDataFromCloud()
          } else {
            saveDataInCloud()
          }
        } else {
          if (!init) {
            setShowLoginWindow(true)
          }
        }
      } else {
        if (!init) {
          setShowLoginWindow(true)
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
    if (email.toString().trim() === '' || password.toString().trim() === '') {
      return
    }
    if (!validateEmail(email.toString().trim())) {
      return
    }
    const server = fetchAPI('')
    server.query({
      query: login,
      variables: {
        email: email.toLowerCase(),
        password
      }
    }).then(async (r: any) => {
      if (r.data.user.login) {
        const u = r.data.user.login
        if (u.__typename) {
          delete u.__typename
        }
        const sU = JSON.stringify(u)
        await AsyncStorage.setItem('user', sU)
        setShowLoginWindow(false)
        loadDataFromCloud()
      }
    }).catch(e => console.log(e))
  }, [email, password])

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
          setRandomShuffleFrequency(u.randomShuffleFrequency)
          setSleepFrom(new Date(u.sleepFrom))
          setSleepTo(new Date(u.sleepTo))
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
          setCues(allCues)
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
            setSubscriptions(res.data.subscription.findByUserId)
            const stringSub = JSON.stringify(res.data.subscription.findByUserId)
            await AsyncStorage.setItem('subscriptions', stringSub)
          }
        })
        .catch(err => console.log(err))
    }
  }, [])

  const saveDataInCloud = useCallback(async () => {

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

    const allCues: any[] = []
    if (parsedCues !== {}) {
      Object.keys(parsedCues).map((key) => {
        parsedCues[key].map((cue: any) => {
          const cueInput = {
            ...cue,
            _id: cue._id.toString(),
            color: cue.color.toString(),
            date: (new Date(cue.date)).toISOString(),
            endPlayAt: cue.endPlayAt && cue.endPlayAt !== '' ? (new Date(cue.endPlayAt)).toISOString() : ''
          }
          delete cueInput.original;
          delete cueInput.status;
          delete cueInput.channelName;
          delete cueInput.__typename
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
        res.data.cue.saveCuesToCloud.map((item: any) => {
          parsedCues["local"][Number(item.oldId)]._id = item.newId
        })
        const updatedCues = JSON.stringify(parsedCues)
        await AsyncStorage.setItem('cues', updatedCues)
      }
    }).catch(err => console.log(err))
  }, [])

  useEffect(() => {
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
  }, [sheetRef, cues])

  const openUpdate = useCallback((key, index, pageNumber, _id, by, channId) => {
    setUpdateModalKey(key)
    setUpdateModalIndex(index)
    setPageNumber(pageNumber)
    setChannelId(channId)
    setCreatedBy(by)
    setCueId(_id)
    openModal('Update')
  }, [])

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
        saveDataInCloud()
      }
    }
  }, [])

  const closeModal = useCallback(() => {
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
    loadData()
  }, [sheetRef, fadeAnimation, modalType, filterChoice])

  const modalContent = modalType === 'Menu' ? <Menu
    sleepFrom={sleepFrom}
    sleepTo={sleepTo}
    randomShuffleFrequency={randomShuffleFrequency}
    setRandomShuffleFrequency={(option: any) => {
      setRandomShuffleFrequency(option)
      storeMenu()
    }}
    setSleepFrom={(date: any) => {
      setSleepFrom(date)
      storeMenu()
    }}
    setSleepTo={(date: any) => {
      setSleepTo(date)
      storeMenu()
    }}
  /> :
    (modalType === 'Create' ? <Create
      customCategories={customCategories}
      closeModal={() => {
        closeModal()
        setPageNumber(0)
      }} />
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
        reloadCueListAfterUpdate={() => reloadCueListAfterUpdate()}
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
                      (
                        modalType === 'Profile' ? <Profile
                          closeModal={() => closeModal()}
                          saveDataInCloud={() => saveDataInCloud()}
                          reOpenProfile={() => {
                            setModalType('')
                            openModal('Profile')
                          }}
                          reloadData={() => {
                            loadData()
                            openModal('Walkthrough')
                          }}
                        /> : null
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

  if (!init) {
    return null;
  }

  return (
    <View style={styles.container}>
      {
        showLoginWindow ? <View style={{
          width: '100%',
          height: '100%',
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
            borderRadius: 20,
            marginTop: 100,
            padding: 40,
            marginHorizontal: 20
          }}>
            <Text style={{ fontSize: 30, color: '#101010', fontFamily: 'inter', paddingBottom: 15, maxWidth: 400, textAlign: 'center' }}>
              Login
              </Text>
            <Text style={{ fontSize: 20, color: '#a6a2a2', fontFamily: 'overpass', paddingBottom: 25, maxWidth: 400, textAlign: 'center' }}>
              Continue where you left off and save changes to the cloud.
              </Text>
            <View style={{
              maxWidth: 400,
              backgroundColor: 'white',
              justifyContent: 'center'
            }}>
              <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
                Email
                </Text>
              <TextInput
                value={email}
                style={styles.input}
                placeholder={''}
                onChangeText={(val: any) => setEmail(val)}
                placeholderTextColor={'#a6a2a2'}
              />
              <Text style={{ color: '#101010', fontSize: 14, paddingBottom: 5 }}>
                Password
              </Text>
              <TextInput
                secureTextEntry={true}
                value={password}
                style={styles.input}
                placeholder={''}
                onChangeText={(val: any) => setPassword(val)}
                placeholderTextColor={'#a6a2a2'}
              />
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  paddingBottom: 10,
                  paddingTop: 20
                }}>
                <TouchableOpacity
                  onPress={() => handleLogin()}
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
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#0079FE',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 35,
                    width: 150,
                    borderRadius: 15,
                  }}>
                    LOGIN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowLoginWindow(false)}
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
                    color: '#101010s',
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: '#f4f4f4',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 35,
                    width: 150,
                    borderRadius: 15,
                  }}>
                    SKIP
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View> : null
      }
      <View style={{
        width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3,
        height: Dimensions.get('window').height,
        flexDirection: 'column',
        backgroundColor: '#f4f4f4',
        paddingTop: 30,
        paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 30
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
          openWalkthrough={() => openModal('Walkthrough')}
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
          openCreate={() => openModal('Create')}
          openChannels={() => openModal('Channels')}
          openProfile={() => openModal('Profile')}
          filterChoice={filterChoice}
          handleFilterChange={(choice: any) => handleFilterChange(choice)}
          key={Math.random()}
          customCategories={customCategories}
          subscriptions={subscriptions}
          setChannelId={(id: string) => setChannelId(id)}
          setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
          setChannelFilterChoice={(choice: string) => setChannelFilterChoice(choice)}
        />
      </View >
      {
        modalType === '' ? <View
          style={{
            width: Dimensions.get('window').width < 1024 ? 0 : Dimensions.get('window').width * 0.7,
            height: Dimensions.get('window').height,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 30,
            paddingTop: 0,
            backgroundColor: '#f4f4f4',
            position: Dimensions.get('window').width < 1024 ? 'absolute' : 'relative'
          }}
        /> :
          <View style={{
            width: Dimensions.get('window').width < 1024 ? '100%' : Dimensions.get('window').width * 0.7,
            height: Dimensions.get('window').height,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 0 : 30,
            paddingTop: 0,
            backgroundColor: '#f4f4f4',
            position: Dimensions.get('window').width < 1024 ? 'absolute' : 'relative'
          }}>
            {
              Dimensions.get('window').width < 1024 ?
                <TouchableOpacity
                  onPress={() => closeModal()}
                  style={{ height: 30, backgroundColor: '#f4f4f4' }}>
                  <Text style={{ flex: 1, textAlign: 'center' }}>
                    <Ionicons name='chevron-down-outline' size={25} color={'#101010'} />
                  </Text>
                </TouchableOpacity> :
                <View style={{ backgroundColor: '#f4f4f4', height: 30 }} />
            }
            {modalContent}
          </View>
      }
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
    width: Dimensions.get('window').width < 1024 ? Dimensions.get('window').width : Dimensions.get('window').width * 0.3,
    justifyContent: "center",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  input: {
    width: '100%',
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    fontSize: 15,
    padding: 15,
    paddingTop: 13,
    paddingBottom: 13,
    marginTop: 5,
    marginBottom: 20
  }
});