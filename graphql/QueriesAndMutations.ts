import { gql } from '@apollo/client';
/**
 * ALL
 * MUTATIONS
 */
export const createUser = gql`
mutation($fullName: String!, $notificationId: String!, $displayName: String!) {
    user {
        create(fullName: $fullName, displayName: $displayName, notificationId: $notificationId) {
            _id
            fullName
            displayName
            notificationId
        }
    }
}
`
export const createChannel = gql`
mutation($name: String!, $password: String, $createdBy: String!) {
    channel {
        create(name: $name, password: $password, createdBy: $createdBy)
    }
}
`
export const createCue = gql`
mutation($cue: String!, $color: String!, $createdBy: String!, $shuffle: Boolean!, $starred: Boolean!, $channelId: String!, $frequency: String!, $submission: Boolean!, $gradeWeight: String!, $endPlayAt: String, $customCategory: String, $deadline: String) {
    cue {
        create(cue: $cue, color: $color, createdBy: $createdBy, shuffle: $shuffle, starred: $starred, channelId: $channelId, frequency: $frequency, submission: $submission, gradeWeight: $gradeWeight, endPlayAt: $endPlayAt, customCategory: $customCategory, deadline: $deadline)
    }
}
`
export const markAsRead = gql`
mutation($userId: String!, $cueId: String!) {
    status {
        markAsRead(userId: $userId,cueId: $cueId)
    }
}
`
export const subscribe = gql`
mutation($name: String!, $userId: String!, $password: String) {
    subscription {
        subscribe(name: $name, userId: $userId, password: $password)
    }
}
`
export const createMessage = gql`
mutation($message: String!, $userId: String!, $channelId: String!, $isPrivate: Boolean!, $anonymous: Boolean!, $parentId: String!, $cueId: String!, $category: String) {
    thread {
        writeMessage(message: $message, userId: $userId, channelId: $channelId, isPrivate: $isPrivate, anonymous: $anonymous, parentId: $parentId, cueId: $cueId, category: $category)
    }
}
`
export const updateUser = gql`
mutation($userId: String!, $displayName: String!, $fullName: String!) {
    user {
        update(userId: $userId, displayName: $displayName, fullName: $fullName)
    }
}
`
export const unsubscribe = gql`
mutation($userId: String!, $channelId: String!, $keepContent: Boolean!) {
    subscription {
        unsubscribe(userId: $userId, channelId: $channelId, keepContent: $keepContent) 
    }
}
`
export const convertToHtml = gql`
mutation($docx: String!) {
    cue {
        convertDocxToHtml(docx: $docx)
    }
}
`
export const signup = gql`
mutation($email: String!, $userId: String!, $password: String!, $fullName: String!, $displayName: String!) {
    user {
        signup(email: $email, userId: $userId, password: $password, fullName: $fullName, displayName: $displayName) 
    }
}
`
export const saveCuesToCloud = gql`
mutation($userId: String!, $cues: [CueInputObject!]!) {
    cue {
        saveCuesToCloud(userId: $userId, cues: $cues) {
            newId
            oldId
        }
    }
}
`
export const saveConfigToCloud = gql`
mutation($userId: String!, $randomShuffleFrequency: String!, $sleepFrom: String!, $sleepTo: String!, $currentDraft: String) {
    user {
        saveConfigToCloud(userId: $userId, randomShuffleFrequency: $randomShuffleFrequency, sleepTo: $sleepTo, sleepFrom: $sleepFrom, currentDraft: $currentDraft)
    }
}
`
/**
 * ALL
 * QUERIES
 */
export const findUserById = gql`
query($id: String!) {
    user {
        findById(id: $id) {
            _id
            fullName
            displayName
            notificationId
            randomShuffleFrequency
            sleepFrom
            sleepTo
            email
            currentDraft
        }
    }
}
`
export const getChannels = gql`
query($userId: String!) {
    channel {
        findByUserId(userId: $userId) {
            _id
            name
        }
    }
}
`
export const getCues = gql`
query($userId: String!) {
    cue {
        findByUserId(userId: $userId) {
            _id
            cue
            color
            channelId
            customCategory
            frequency
            date
            endPlayAt
            channelName
            starred
            createdBy
            shuffle
            status
            original
            submission
            deadline
            gradeWeight
            score
            graded
        }
    }
}
`
export const getSubscriptions = gql`
query($userId: String!) {
    subscription {
        findByUserId(userId: $userId) {
            _id
            channelName
            channelId
            channelCreatedBy
        }
    }
}
`
export const checkChannelStatus = gql`
query($name: String!) {
    channel {
        getChannelStatus(name: $name)
    }
}
`
export const getChannelThreads = gql`
query($channelId: String!) {
    thread {
        findByChannelId(channelId: $channelId) {
            _id
            message
            channelId
            cueId
            parentId
            category
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getCueThreads = gql`
query($cueId: String!) {
    thread {
        findByCueId(cueId: $cueId) {
            _id
            message
            channelId
            cueId
            parentId
            category
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getThreadWithReplies = gql`
query($threadId: String!) {
    thread {
        getThreadWithReplies(threadId: $threadId) {
            _id
            message
            channelId
            cueId
            parentId
            category
            time
            userId
            displayName
            isPrivate
            anonymous
        }
    }
}
`
export const getThreadCategories = gql`
query($channelId: String!) {
    thread {
        getChannelThreadCategories(channelId: $channelId) 
    }
}
`
export const getChannelCategories = gql`
query($channelId: String!) {
    channel {
        getChannelCategories(channelId: $channelId) 
    }
}
`
export const getSubscribers = gql`
query($channelId: String!) {
    user {
        findByChannelId(channelId: $channelId) {
            _id
            displayName
            fullName
        }
    }
}
`
export const getStatuses = gql`
query($cueId: String!) {
    status {
        findByCueId(cueId: $cueId) {
            displayName
            userId
            status
        }
    }
}
`
export const login = gql`
query($email: String!, $password: String!) {
    user {
        login(email: $email, password: $password) {
            _id
        } 
    }
}
`
export const getCuesFromCloud = gql`
query($userId: String!) {
    cue {
        getCuesFromCloud(userId: $userId) {
            _id
            cue
            color
            channelId
            customCategory
            frequency
            date
            endPlayAt
            channelName
            starred
            createdBy
            shuffle
            status
            original
        }
    }
}
`