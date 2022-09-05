import React, { useEffect, useState } from 'react';

import SidebarNavigation from '../SidebarNavigation';

import CalendarX from '../../components/Calendar';

import { useNavigationContext } from '../../contexts/NavigationContext';

const NavigationWrapper: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { route } = useNavigationContext();

    console.log('Route', route);

    const renderMainComponent = () => {
        switch (route) {
            case 'home':
                return (
                    <CalendarX
                        tab={'Agenda'}
                        setTab={(val: any) => {}}
                        filterStart={null}
                        filterEnd={null}
                        openCue={props.openCue}
                        openDiscussion={props.openDiscussionFromActivity}
                        openChannel={props.openChannelFromActivity}
                    />
                );
        }
    };

    return <SidebarNavigation>{renderMainComponent()}</SidebarNavigation>;
};

export default NavigationWrapper;
