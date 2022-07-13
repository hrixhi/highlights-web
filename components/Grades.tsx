// REACT
import React, { useState } from 'react';

// COMPONENTS
import { View } from './Themed';
import GradesList from './GradesList';

const Grades: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // MAIN RETURN
    return (
        <View style={{ width: '100%', backgroundColor: '#fff' }}>
            <GradesList
                channelName={props.filterChoice}
                isOwner={props.isOwner}
                channelId={props.channelId}
                closeModal={() => props.closeModal()}
                openCueFromGrades={props.openCueFromGrades}
                activeTab={props.activeTab}
                channelColor={props.channelColor}
                report={props.report}
                attendance={props.attendance}
                thread={props.thread}
                date={props.date}
                showNewAssignment={props.showNewAssignment}
                setShowNewAssignment={props.setShowNewAssignment}
            />
        </View>
    );
};

export default Grades;
