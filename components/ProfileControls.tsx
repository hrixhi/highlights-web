import React, { useState, useEffect, useCallback } from "react";
import { Dimensions, Image, StyleSheet } from "react-native";
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
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<any>(undefined)
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSavePassword, setShowSavePassword] = useState(false);
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

    if (showSavePassword) {
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
    showSavePassword,
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
      showSavePassword &&
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
      !showSavePassword &&
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
    showSavePassword,
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

  if (!userFound) {
    return (
      <View style={styles.screen} key={1}>
        <View style={{ width: "100%", backgroundColor: "white" }}>
          <View style={styles.colorBar}>
            <Text style={{ fontSize: 20, color: "#818385" }}>
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
        style={{ width: "100%", backgroundColor: "white" }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 23,
            paddingBottom: 30,
            fontFamily: 'inter',
            // textTransform: "uppercase",
            // paddingLeft: 10,
            // flex: 1,
            lineHeight: 25
          }}>
          {PreferredLanguageText('profile')}
        </Text>
        {/*}
        <Text
          style={{
            fontSize: 12,
            paddingTop: 10,
            color: "#818385",
            fontFamily: "overpass",
            paddingBottom: 25,
            // textAlign: "center"
          }}
        >
          {!loggedIn ? PreferredLanguageText('createAccount') : ""}
        </Text> */}
        {showSavePassword ? (
          <View
            style={{
              width: "100%",
              backgroundColor: "white",
              paddingTop: 20,
              paddingBottom: 20
            }}
          >
            <Text style={{
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('currentPassword')}
            </Text>
            <TextInput
              secureTextEntry={true}
              value={currentPassword}
              placeholder={""}
              onChangeText={val => setCurrentPassword(val)}
              placeholderTextColor={"#818385"}
            />
            <Text style={{
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('newPassword')}
            </Text>
            <TextInput
              secureTextEntry={true}
              value={newPassword}
              placeholder={""}
              onChangeText={val => setNewPassword(val)}
              placeholderTextColor={"#818385"}
              errorText={newPasswordValidError}
              footerMessage={
                PreferredLanguageText('atleast8char')
              }
            />
            <Text style={{
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('confirmNewPassword')}
            </Text>
            <TextInput
              secureTextEntry={true}
              value={confirmNewPassword}
              placeholder={""}
              onChangeText={val => setConfirmNewPassword(val)}
              placeholderTextColor={"#818385"}
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
                height: 150,
                width: 150,
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
                  <Text style={{
                    textAlign: 'center',
                    lineHeight: 30,
                    color: '#fff',
                    fontSize: 12,
                    backgroundColor: '#33A9F4',
                    paddingHorizontal: 25,
                    fontFamily: 'inter',
                    height: 30,
                    // width: 100,
                    borderRadius: 15,
                    textTransform: 'uppercase'
                  }}>
                    REMOVE
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
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('email')}
            </Text>
            <TextInput
              editable={!loggedIn}
              value={email}
              placeholder={""}
              onChangeText={val => setEmail(val)}
              placeholderTextColor={"#818385"}
              required={true}
              errorText={emailValidError}
            />
            <Text style={{
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('fullName')}
            </Text>
            <TextInput
              value={fullName}
              placeholder={""}
              onChangeText={val => setFullName(val)}
              placeholderTextColor={"#818385"}
              required={true}
            />
            <Text style={{
              fontSize: 15,
              fontFamily: 'inter',
              color: '#43434f'
            }}>
              {PreferredLanguageText('displayName')}
            </Text>
            <TextInput
              value={displayName}
              placeholder={""}
              onChangeText={val => setDisplayName(val)}
              placeholderTextColor={"#818385"}
              required={true}
            />
            {loggedIn ? null : (
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'inter',
                    color: '#43434f'
                  }}
                >
                  {PreferredLanguageText('password')}
                </Text>
                <TextInput
                  value={password}
                  placeholder={""}
                  onChangeText={val => setPassword(val)}
                  placeholderTextColor={"#818385"}
                  secureTextEntry={true}
                  required={true}
                  footerMessage={
                    PreferredLanguageText('atleast8char')
                  }
                  errorText={passwordValidError}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'inter',
                    color: '#43434f'
                  }}
                >
                  {PreferredLanguageText('confirmPassword')}
                </Text>
                <TextInput
                  value={confirmPassword}
                  placeholder={""}
                  onChangeText={val => setConfirmPassword(val)}
                  placeholderTextColor={"#818385"}
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
            display: "flex",
            // paddingTop: 30
          }}
        >
          {loggedIn ? (
            <TouchableOpacity
              onPress={() => setShowSavePassword(!showSavePassword)}
              style={{
                backgroundColor: "white",
                overflow: "hidden",
                height: 35,
                marginTop: 20,
                width: "100%",
                justifyContent: "center",
                flexDirection: "row"
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  lineHeight: 35,
                  color: "#43434f",
                  fontSize: 12,
                  backgroundColor: "#FBFBFC",
                  paddingHorizontal: 25,
                  fontFamily: "inter",
                  height: 35,
                  width: 150,
                  borderRadius: 15,
                  textTransform: "uppercase"
                }}
              >
                {showSavePassword ? PreferredLanguageText('back') : PreferredLanguageText('password')}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => handleSubmit()}
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              height: 35,
              marginTop: 15,
              width: "100%",
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
                backgroundColor: "#6963e2",
                paddingHorizontal: 25,
                fontFamily: "inter",
                height: 35,
                borderRadius: 15,
                width: 150,
                textTransform: "uppercase"
              }}
            >
              {loggedIn ? (showSavePassword ? PreferredLanguageText('update') : PreferredLanguageText('save')) : PreferredLanguageText('signUp')}
            </Text>
          </TouchableOpacity>
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
              width: "100%",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                lineHeight: 35,
                color: "#43434f",
                fontSize: 12,
                backgroundColor: "#FBFBFC",
                paddingHorizontal: 25,
                fontFamily: "inter",
                height: 35,
                width: 150,
                borderRadius: 15,
                textTransform: 'uppercase'
              }}
            >
              {loggedIn ? PreferredLanguageText('logout') : PreferredLanguageText('login')}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingBottom: 20, width: '100%', marginTop: 30, marginBottom: 100 }}>
            <LanguageSelect />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileControls;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Dimensions.get("window").width < 768 ? 0 : 20,
    width: "100%",
    // maxWidth: 600,
    alignSelf: 'center',
    height: Dimensions.get("window").height - 110,
    backgroundColor: "white"
  },
  outline: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#818385"
  },
  all: {
    fontSize: 15,
    color: "#818385",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white"
  },
  allOutline: {
    fontSize: 15,
    color: "#818385",
    height: 22,
    paddingHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#818385"
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
