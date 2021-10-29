import React, { useState, useEffect, useCallback } from "react";
import { Dimensions, Image, Linking, Platform, StyleSheet } from "react-native";
import { Text, View, TouchableOpacity } from "./Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native-gesture-handler";
import { fetchAPI } from "../graphql/FetchAPI";
import {
  signup,
  updatePassword,
  updateUser
} from "../graphql/QueriesAndMutations";
import { validateEmail } from "../helpers/emailCheck";
import Alert from "../components/Alert";
import { TextInput } from "./CustomTextInput";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import { LanguageSelect } from '../helpers/LanguageContext';
import OneSignal from 'react-onesignal';
import FileUpload from "./UploadFiles";
import { Ionicons } from "@expo/vector-icons";

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (
  props: any
) => {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<any>(undefined)
  const [zoomInfo, setZoomInfo] = useState<any>(undefined)
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  // Signup Validation
  const [emailValidError, setEmailValidError] = useState("");
  const [passwordValidError, setPasswordValidError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Change Password Validation
  const [newPasswordValidError, setNewPasswordValidError] = useState("");
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("");

  // Current Profile Change Validation
  // Store existing fullname and displayname to see if anything has changed when updating profile
  const [currentFullName, setCurrentFullName] = useState("");
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<any>(undefined)

  // Alerts
  const passwordUpdatedAlert = PreferredLanguageText('passwordUpdated');
  const incorrectCurrentPasswordAlert = PreferredLanguageText('incorrectCurrentPassword');
  const passwordDoesNotMatchAlert = PreferredLanguageText('passwordDoesNotMatch');
  const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
  const profileUpdatedAlert = PreferredLanguageText('profileUpdated');
  const enterValidEmailError = PreferredLanguageText('enterValidEmail')
  const passwordInvalidError = PreferredLanguageText('atleast8char')

  const handleSubmit = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    if (!u) {
      return;
    }
    const user = JSON.parse(u);
    const server = fetchAPI("");

    if (props.showSavePassword) {
      // reset password
      server
        .mutate({
          mutation: updatePassword,
          variables: {
            userId: user._id,
            currentPassword,
            newPassword
          }
        })
        .then(res => {
          if (res.data && res.data.user.updatePassword) {
            Alert(passwordUpdatedAlert);
            props.reOpenProfile();
          } else {
            Alert(incorrectCurrentPasswordAlert);
          }
        })
        .catch(err => {
          Alert(somethingWentWrongAlert);
        });
      return;
    }

    // if (!loggedIn) {
    //   server
    //     .mutate({
    //       mutation: signup,
    //       variables: {
    //         email: email
    //           .toString()
    //           .trim()
    //           .toLowerCase(),
    //         password: password.toString(),
    //         fullName: fullName.toString().trim(),
    //         displayName: displayName.toString().trim(),
    //         userId: user._id
    //       }
    //     })
    //     .then(async res => {
    //       console.log(res);
    //       if (res.data.user.signup === "") {
    //         const user = JSON.parse(u);
    //         user.email = email;
    //         user.fullName = fullName;
    //         user.displayName = displayName;
    //         const updatedUser = JSON.stringify(user);
    //         await AsyncStorage.setItem("user", updatedUser);
    //         props.saveDataInCloud();
    //         props.reOpenProfile();
    //       } else {
    //         // Error
    //         Alert(res.data.user.signup || somethingWentWrongAlert);
    //       }
    //     });
    // } else {
    // update profile if already logged in
    server
      .mutate({
        mutation: updateUser,
        variables: {
          displayName,
          fullName,
          userId: user._id,
          avatar
        }
      })
      .then(async res => {
        if (res.data && res.data.user.update) {
          user.fullName = fullName;
          user.displayName = displayName;
          user.avatar = avatar
          const updatedUser = JSON.stringify(user);
          await AsyncStorage.setItem("user", updatedUser);
          Alert(profileUpdatedAlert);
          props.reOpenProfile();
        } else {
          Alert(somethingWentWrongAlert);
        }
      })
      .catch(e => Alert(somethingWentWrongAlert));
    //}
  }, [
    loggedIn,
    email,
    password,
    avatar,
    displayName,
    fullName,
    confirmPassword,
    props.showSavePassword,
    newPassword,
    currentPassword
  ]);

  const getUser = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    if (u) {
      const parsedUser = JSON.parse(u);
      if (parsedUser.email) {
        setLoggedIn(true);
        setEmail(parsedUser.email);
        setDisplayName(parsedUser.displayName);
        setFullName(parsedUser.fullName);
        setAvatar(parsedUser.avatar ? parsedUser.avatar : undefined)
        setCurrentAvatar(parsedUser.avatar ? parsedUser.avatar : undefined)
        setUserId(parsedUser._id);
        setZoomInfo(parsedUser.zoomInfo ? parsedUser.zoomInfo : undefined)
        setCurrentDisplayName(parsedUser.displayName);
        setCurrentFullName(parsedUser.fullName);
      }
      setUserFound(true);
    }
  }, []);

  const logout = useCallback(async () => {
    OneSignal.removeExternalUserId()
    await AsyncStorage.clear();
    window.location.reload();
  }, []);

  useEffect(() => {
    getUser();
  }, []);

  //   Validate if submit is enabled after every state change
  useEffect(() => {
    // Reset Password state
    if (
      props.showSavePassword &&
      currentPassword &&
      newPassword &&
      confirmNewPassword &&
      !newPasswordValidError &&
      !confirmNewPasswordError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // Logged in
    if (
      !props.showSavePassword &&
      loggedIn &&
      fullName &&
      displayName &&
      (fullName !== currentFullName || displayName !== currentDisplayName || avatar !== currentAvatar)
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    // Not logged in
    if (
      !loggedIn &&
      email &&
      fullName &&
      displayName &&
      password &&
      confirmPassword &&
      !emailValidError &&
      !passwordValidError &&
      !confirmPasswordError
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [
    loggedIn,
    email,
    fullName,
    displayName,
    avatar,
    currentAvatar,
    password,
    confirmPassword,
    emailValidError,
    passwordValidError,
    confirmPasswordError,
    props.showSavePassword,
    currentPassword,
    newPassword,
    confirmNewPassword,
    newPasswordValidError,
    confirmNewPasswordError,
    currentDisplayName,
    currentFullName
  ]);

  useEffect(() => {
    if (email && !validateEmail(email.toString().toLowerCase())) {
      setEmailValidError(enterValidEmailError);
      return;
    }

    setEmailValidError("");
  }, [email]);

  useEffect(() => {
    const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (password && !validPasswrdRegex.test(password)) {
      setPasswordValidError(passwordInvalidError);
      return;
    }

    setPasswordValidError("");
  }, [password]);

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError(passwordDoesNotMatchAlert);
      return;
    }

    setConfirmPasswordError("");
  }, [password, confirmPassword]);

  useEffect(() => {
    const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (newPassword && !validPasswrdRegex.test(newPassword)) {
      setNewPasswordValidError(passwordInvalidError);
      return;
    }

    setNewPasswordValidError("");
  }, [newPassword]);

  useEffect(() => {
    if (
      newPassword &&
      confirmNewPassword &&
      newPassword !== confirmNewPassword
    ) {
      setConfirmNewPasswordError(passwordDoesNotMatchAlert);
      return;
    }

    setConfirmNewPasswordError("");
  }, [newPassword, confirmNewPassword]);

  const handleZoomAuth = useCallback(async () => {

    let url = ''

    // LIVE
    // const clientId = 'yRzKFwGRTq8bNKLQojwnA'
    // DEV
    const clientId = 'PAfnxrFcSd2HkGnn9Yq96A'

    if (zoomInfo) {
      // de-auth
      // TBD
      url = ''
    } else {
      // auth

      // LIVE
      // const redirectUri = 'https://web.cuesapp.co/zoom_auth'
      // DEV      
      const redirectUri = 'http://localhost:19006/zoom_auth'

      url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Linking.openURL(url)
    } else {
      window.open(url)
    }

  }, [zoomInfo, userId])

  if (!userFound) {
    return (
      <View style={styles.screen} key={1}>
        <View style={{ width: "100%", backgroundColor: "white" }}>
          <View style={styles.colorBar}>
            <Text style={{ fontSize: 20, color: "#1F1F1F" }}>
              {PreferredLanguageText('internetRequiried')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} key={1}>
      <ScrollView
        style={{
          width: "100%",
          maxHeight: Dimensions.get("window").width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
          backgroundColor: "white"
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
          <View style={{ maxWidth: 400, width: '100%' }}>
            {props.showSavePassword ? (
              <View
                style={{
                  width: "100%",
                  backgroundColor: "white",
                  paddingTop: 20,
                  paddingBottom: 20
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('currentPassword')}
                </Text>
                <TextInput
                  secureTextEntry={true}
                  value={currentPassword}
                  placeholder={""}
                  onChangeText={val => setCurrentPassword(val)}
                  placeholderTextColor={"#1F1F1F"}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('newPassword')}
                </Text>
                <TextInput
                  secureTextEntry={true}
                  value={newPassword}
                  placeholder={""}
                  onChangeText={val => setNewPassword(val)}
                  placeholderTextColor={"#1F1F1F"}
                  errorText={newPasswordValidError}
                  footerMessage={
                    PreferredLanguageText('atleast8char')
                  }
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('confirmNewPassword')}
                </Text>
                <TextInput
                  secureTextEntry={true}
                  value={confirmNewPassword}
                  placeholder={""}
                  onChangeText={val => setConfirmNewPassword(val)}
                  placeholderTextColor={"#1F1F1F"}
                  errorText={confirmNewPasswordError}
                />
              </View>
            ) : (
              <View
                style={{
                  width: "100%",
                  backgroundColor: "white",
                  paddingTop: 20,
                  paddingBottom: 20
                }}
              >
                <Image
                  style={{
                    height: 100,
                    width: 100,
                    borderRadius: 75,
                    // marginTop: 20,
                    alignSelf: 'center'
                  }}
                  source={{ uri: avatar ? avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                />
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', paddingTop: 15 }}>
                  {
                    avatar ? <TouchableOpacity
                      onPress={() => setAvatar(undefined)}
                      style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        // marginLeft: 20,
                        // marginTop: 15,
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}>
                      <Text>
                        <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                      </Text>
                    </TouchableOpacity> : <FileUpload
                      onUpload={(u: any, t: any) => {
                        setAvatar(u)
                      }}
                    />
                  }
                </View>
                <Text style={{
                  marginTop: 20,
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('email')}
                </Text>
                <TextInput
                  editable={!loggedIn}
                  value={email}
                  placeholder={""}
                  onChangeText={val => setEmail(val)}
                  placeholderTextColor={"#1F1F1F"}
                  required={true}
                  errorText={emailValidError}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('fullName')}
                </Text>
                <TextInput
                  value={fullName}
                  placeholder={""}
                  onChangeText={val => setFullName(val)}
                  placeholderTextColor={"#1F1F1F"}
                  required={true}
                />
                {/* <Text style={{
                  fontSize: 14,
                  fontFamily: 'inter',
                  color: '#000000'
                }}>
                  {PreferredLanguageText('displayName')}
                </Text>
                <TextInput
                  value={displayName}
                  placeholder={""}
                  onChangeText={val => setDisplayName(val)}
                  placeholderTextColor={"#1F1F1F"}
                  required={true}
                /> */}
                {loggedIn ? null : (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#000000'
                      }}
                    >
                      {PreferredLanguageText('password')}
                    </Text>
                    <TextInput
                      value={password}
                      placeholder={""}
                      onChangeText={val => setPassword(val)}
                      placeholderTextColor={"#1F1F1F"}
                      secureTextEntry={true}
                      required={true}
                      footerMessage={
                        PreferredLanguageText('atleast8char')
                      }
                      errorText={passwordValidError}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: '#000000'
                      }}
                    >
                      {PreferredLanguageText('confirmPassword')}
                    </Text>
                    <TextInput
                      value={confirmPassword}
                      placeholder={""}
                      onChangeText={val => setConfirmPassword(val)}
                      placeholderTextColor={"#1F1F1F"}
                      secureTextEntry={true}
                      required={true}
                      errorText={confirmPasswordError}
                    />
                  </View>
                )}
              </View>
            )}
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                justifyContent: "center",
                // flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row'
                // paddingTop: 30
              }}
            >
              <TouchableOpacity
                onPress={() => handleSubmit()}
                style={{
                  backgroundColor: "white",
                  overflow: "hidden",
                  height: 35,
                  marginTop: 15,
                  // width: "100%",
                  justifyContent: "center",
                  flexDirection: "row"
                }}
                disabled={isSubmitDisabled}
              >
                <Text
                  style={{
                    textAlign: "center",
                    lineHeight: 35,
                    color: "white",
                    fontSize: 12,
                    backgroundColor: "#006AFF",
                    paddingHorizontal: 20,
                    fontFamily: "inter",
                    height: 35,
                    borderRadius: 15,
                    width: 175,
                    textTransform: "uppercase"
                  }}
                >
                  {loggedIn ? (props.showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save')) : PreferredLanguageText('signUp')}
                </Text>
              </TouchableOpacity>
              {loggedIn && !props.showSavePassword ? (
                <TouchableOpacity
                  onPress={() => props.setShowSavePassword(!props.showSavePassword)}
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 20,
                    // width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      color: '#006AFF',
                      borderWidth: 1,
                      borderRadius: 15,
                      borderColor: '#006AFF',
                      backgroundColor: '#fff',
                      fontSize: 12,
                      paddingHorizontal: 20,
                      fontFamily: "inter",
                      height: 35,
                      width: 175,
                      textTransform: "uppercase"
                    }}
                  >
                    {props.showSavePassword ? PreferredLanguageText('back') : PreferredLanguageText('password')}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {
                props.showSavePassword ? null :
                  <TouchableOpacity
                    onPress={() => {
                      if (loggedIn) {
                        logout();
                      } else {
                        window.location.reload();
                      }
                    }}
                    style={{
                      backgroundColor: "white",
                      overflow: "hidden",
                      height: 35,
                      marginTop: 15,
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
                      {loggedIn ? PreferredLanguageText('logout') : PreferredLanguageText('login')}
                    </Text>
                  </TouchableOpacity>
              }
              {loggedIn && !props.showSavePassword ? (
                <TouchableOpacity
                  onPress={() => handleZoomAuth()}
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 20,
                    // width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 35,
                      paddingHorizontal: 20,
                      fontFamily: "inter",
                      height: 35,
                      color: '#006AFF',
                      borderWidth: 1,
                      borderRadius: 15,
                      borderColor: '#006AFF',
                      backgroundColor: '#fff',
                      fontSize: 12,
                      width: 175,
                      textTransform: "uppercase"
                    }}
                  >
                    {zoomInfo ? 'Disconnect Zoom' : 'Connect Zoom'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {
                props.showHelp || props.showSaveCue ? null : <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 20, width: '100%', marginTop: 30, marginBottom: 100 }}>
                  <LanguageSelect />
                </View>
              }
            </View>
          </View>
        </View>
      </ScrollView>
    </View >
  );
};

export default ProfileControls;

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    height: Dimensions.get("window").width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
    backgroundColor: 'white',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  outline: {
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#1F1F1F"
  },
  all: {
    fontSize: 14,
    color: "#1F1F1F",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allOutline: {
    fontSize: 14,
    color: "#1F1F1F",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#1F1F1F"
  },
  colorBar: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "white",
    marginBottom: "15%",
    lineHeight: 18,
    paddingTop: 15
  }
});
