import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '2e87453f-b4fc-49bb-954c-a887421fea58',
  name: 'Default Ai task Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '729e12b4-81f5-4e3e-b379-98e33bffdb23',
  tabs: [
    {
      universalIdentifier: '7663fcf8-5c86-4060-a46c-cee5b5ecdc6e',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '1e090ddd-3104-4071-9b05-940500593a38',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'ff1c4cb3-4e7d-422b-80e7-0ff16cad38c6',
          },
        },
      ],
    },
    {
      universalIdentifier: '9a8ea2d5-218d-4897-bf3d-36d3bca9920c',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'ccb3f193-e03a-4453-979b-62d1663b5d01',
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
