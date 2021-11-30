// REACT
import React, { useState, useEffect, useCallback } from "react";
import { Image, Linking, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// API
import { fetchAPI } from "../graphql/FetchAPI";
import {
  updatePassword,
  updateUser
} from "../graphql/QueriesAndMutations";

// COMPONENTS
import { Text, View, TouchableOpacity } from "./Themed";
import { ScrollView } from "react-native-gesture-handler";
import Alert from "../components/Alert";
import { TextInput } from "./CustomTextInput";
import OneSignal from 'react-onesignal';
import FileUpload from "./UploadFiles";

// HELPERS
import { PreferredLanguageText } from "../helpers/LanguageContext";
// import { LanguageSelect } from '../helpers/LanguageContext';
import { zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const ProfileControls: React.FunctionComponent<{ [label: string]: any }> = (
  props: any
) => {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState('')
  const [avatar, setAvatar] = useState<any>(undefined)
  const [zoomInfo, setZoomInfo] = useState<any>(undefined)
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [passwordValidError, setPasswordValidError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [newPasswordValidError, setNewPasswordValidError] = useState("");
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("");
  const [currentFullName, setCurrentFullName] = useState("");
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<any>(undefined)
  // Alerts
  const passwordUpdatedAlert = PreferredLanguageText('passwordUpdated');
  const incorrectCurrentPasswordAlert = PreferredLanguageText('incorrectCurrentPassword');
  const passwordDoesNotMatchAlert = PreferredLanguageText('passwordDoesNotMatch');
  const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
  const profileUpdatedAlert = PreferredLanguageText('profileUpdated');
  const passwordInvalidError = PreferredLanguageText('atleast8char')

  // HOOKS

  /**
   * @description Fetch user on Init
   */
  useEffect(() => {
    getUser();
  }, []);

  /**
   * @description Validate if submit is enabled after every state change
   */
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
      fullName &&
      displayName &&
      (fullName !== currentFullName || displayName !== currentDisplayName || avatar !== currentAvatar)
    ) {
      setIsSubmitDisabled(false);
      return;
    }

    setIsSubmitDisabled(true);
  }, [
    email,
    fullName,
    displayName,
    avatar,
    currentAvatar,
    confirmPassword,
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

  /**
   * @description Validates new password
   */
  useEffect(() => {
    const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (newPassword && !validPasswrdRegex.test(newPassword)) {
      setNewPasswordValidError(passwordInvalidError);
      return;
    }

    setNewPasswordValidError("");
  }, [newPassword]);

  /**
   * @description Verifies if confirm new password matches new password
   */
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

  /**
   * @description Handles submit new password or Update user profile
   */
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
    email,
    avatar,
    displayName,
    fullName,
    confirmPassword,
    props.showSavePassword,
    newPassword,
    currentPassword
  ]);

  /**
   * @description Loads User profile
   */
  const getUser = useCallback(async () => {
    const u = await AsyncStorage.getItem("user");
    if (u) {
      const parsedUser = JSON.parse(u);
      if (parsedUser.email) {
        setEmail(parsedUser.email);
        setDisplayName(parsedUser.displayName);
        setFullName(parsedUser.fullName);
        setAvatar(parsedUser.avatar ? parsedUser.avatar : undefined);
        setCurrentAvatar(parsedUser.avatar ? parsedUser.avatar : undefined)
        setUserId(parsedUser._id);
        setZoomInfo(parsedUser.zoomInfo ? parsedUser.zoomInfo : undefined)
        setCurrentDisplayName(parsedUser.displayName);
        setCurrentFullName(parsedUser.fullName);
      }
      setUserFound(true);
    }
  }, []);

  /**
   * @description Log out 
   */
  const logout = useCallback(async () => {
    OneSignal.removeExternalUserId()
    await AsyncStorage.clear();
    window.location.reload();
  }, []);

  /**
   * @description Handles Zoom Auth => Connect user's zoom profile to Cues 
   */
  const handleZoomAuth = useCallback(async () => {

    let url = ''


    if (zoomInfo) {
      // de-auth
      // TBD
      url = ''
    } else {
      // auth
      url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(zoomRedirectUri)}&state=${userId}`
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Linking.openURL(url)
    } else {
      window.open(url)
    }

  }, [zoomInfo, userId])

  // MAIN RETURN
  
  return (
    <View style={styles.screen} key={1}>
      <ScrollView
        style={{
          width: "100%",
          backgroundColor: "white"
        }}
        showsVerticalScrollIndicator={true}
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
                  color: '#000000'
                }}>
                  {PreferredLanguageText('currentPassword')}
                </Text>
                <TextInput
                  secureTextEntry={true}
                  autoCompleteType="password"
                  textContentType="password"
                  value={currentPassword}
                  placeholder={""}
                  onChangeText={val => setCurrentPassword(val)}
                  placeholderTextColor={"#1F1F1F"}
                />
                <Text style={{
                  fontSize: 14,
                  color: '#000000'
                }}>
                  {PreferredLanguageText('newPassword')}
                </Text>
                <TextInput
                  secureTextEntry={true}
                  autoCompleteType="off"
                  textContentType="newPassword"
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
                  color: '#000000'
                }}>
                  {PreferredLanguageText('email')}
                </Text>
                <TextInput
                  editable={false}
                  value={email}
                  placeholder={""}
                  onChangeText={val => setEmail(val)}
                  placeholderTextColor={"#1F1F1F"}
                  required={true}
                  style={{
                    borderBottomWidth: 0
                  }}
                />
                <Text style={{
                  fontSize: 14,
                  color: '#000000'
                }}>
                  {PreferredLanguageText('fullName')}
                </Text>
                <TextInput
                  textContentType="name"
                  autoCompleteType="off"
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
              </View>
            )}
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => handleSubmit()}
                style={{
                  backgroundColor: "white",
                  overflow: "hidden",
                  height: 35,
                  marginTop: 15,
                  justifyContent: "center",
                  flexDirection: "row"
                }}
                disabled={isSubmitDisabled}
              >
                <Text
                  style={{
                    textAlign: "center",
                    lineHeight: 34,
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
                  {(props.showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save'))}
                </Text>
              </TouchableOpacity>
              {!props.showSavePassword ? (
                <TouchableOpacity
                  onPress={() => props.setShowSavePassword(!props.showSavePassword)}
                  style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 20,
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      lineHeight: 34,
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
              {!props.showSavePassword && !zoomInfo ? (
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
                      lineHeight: 34,
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
                    Connect Zoom
                  </Text>
                </TouchableOpacity>
              ) : null}
              {
                props.showSavePassword ? null :
                <TouchableOpacity
                    onPress={() => logout()}
                    style={{ backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    marginTop: 20,
                    marginBottom: 30,
                    width: '100%', justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="log-out-outline" color="#006AFF" style={{ marginRight: 10 }} size={18} />
                    <Text style={{
                      fontSize: 14,
                      color: '#006AFF'
                    }}>
                      Log Out
                    </Text>
                  </TouchableOpacity>
              }
              {
                props.showHelp || props.showSaveCue ? null : <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 20, width: '100%', marginTop: 30, marginBottom: 100 }}>
                  {/* <LanguageSelect /> */}
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
    backgroundColor: 'white',
    justifyContent: 'center',
    flexDirection: 'row',
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
