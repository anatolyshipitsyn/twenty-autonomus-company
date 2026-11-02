import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '1023b843-1f7a-4791-8520-3f927e41ab56',
  name: 'Default Ai task Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '95867ede-7b17-465f-990c-40675d1dec71',
  tabs: [
    {
      universalIdentifier: '0d063a23-ca4c-44e8-8272-a27a4b3bdbba',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '78a854d5-48ce-4602-a088-047601a996b8',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'e679e8e0-7ca1-4cd0-b0bc-c5c7bdf47008',
          },
        },
      ],
    },
    {
      universalIdentifier: '89ac4b4b-0cd9-4973-b75e-77e662618565',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'a681a25b-7b54-43fe-bc60-7b46407a43fc',
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: {
            configurationType: 'TIMELINE',
          },
        },
      ],
    },
  ],
});
