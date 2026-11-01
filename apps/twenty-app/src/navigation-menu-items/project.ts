import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';
import {
  PROJECT_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: PROJECT_NAVIGATION_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'project',
  icon: 'IconCompass',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
});
