import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: 'e6c4bd3e-46d2-49a6-94d7-e2da7e2b5d28',
  name: 'Default AI Run Journal Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  tabs: [
    {
      universalIdentifier: '1b626100-5b6a-41f3-8684-d2ae7b002f15',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '8bb39a2a-c202-447c-b1a3-2a8c276b0586',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'e8414e50-89a0-4c27-93b2-537d0ab3af76',
          },
        },
      ],
    },
    {
      universalIdentifier: 'b384b098-6458-4dcd-8dd1-bd7cce4b2ef1',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '74a4eb98-4964-40e4-8ab7-35e521f3f344',
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
