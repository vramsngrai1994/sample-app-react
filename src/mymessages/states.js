import {FoldersStorage, MessagesStorage} from '../global/dataSources';
import MessageListUI from './messageListUIService';

import Compose from './Compose';
import MyMessages from './MyMessages';
import Message from './Message';
import MessageList from './MessageList';
/**
* This state allows the user to compose a new message, edit a drafted message, send a message,
* or save an unsent message as a draft.
*
* This state uses view-targeting to take over the ui-view that would normally be filled by the 'mymessages' state.
*/
const composeState = {
  name: 'mymessages.compose',
  url: '/compose',
  // Declares that this state has a 'message' parameter, that defaults to an empty object.
  // Note the parameter does not appear in the URL.
  params: {
    message: {}
  },
  views: {
    // Absolutely targets the $default (unnamed) ui-view, two nesting levels down with the composeComponent.
    "!$default.$default": Compose
  }
};

/**
* The mymessages state. This is the main state for the mymessages page.
*
* This state shows the list of folders for the current user. It retrieves the folders from the
* Folders service.  If a user navigates directly to this state, the state redirects to the 'mymessages.messagelist'.
*/
const mymessagesState = {
  parent: 'app',
  name: "mymessages",
  url: "/mymessages",
  resolve: [
    // All the folders are fetched from the Folders service
    {
      token: 'folders',
      resolveFn: () => FoldersStorage.all(),
    },
  ],
  // If mymessages state is directly activated, redirect the transition to the child state 'mymessages.messagelist'
  redirectTo: 'mymessages.messagelist',
  component: MyMessages,
  // Mark this state as requiring authentication.  See ../routerhooks/requiresAuth.js.
  data: { requiresAuth: true }
};

/**
* This state shows the contents of a single message.
* It also has UI to reply, forward, delete, or edit an existing draft.
*/
const messageState = {
  name: 'mymessages.messagelist.message',
  url: '/:messageId',
  resolve: [
    // Fetch the message from the Messages service using the messageId parameter
    {
      token: 'message',
      deps: ['$transition$'],
      resolveFn: ($transition$) => MessagesStorage.get($transition$.params().messageId),
    },
    // Provide the component with a function it can query that returns the closest message id
    {
      token: 'nextMessageGetter',
      deps: ['messages'],
      resolveFn: (messages) => MessageListUI.proximalMessageId.bind(MessageListUI, messages),
    },
  ],
  views: {
    // Relatively target the parent-state's parent-state's 'messagecontent' ui-view
    // This could also have been written using ui-view@state addressing: 'messagecontent@mymessages'
    // Or, this could also have been written using absolute ui-view addressing: '!$default.$default.messagecontent'
    "^.^.messagecontent": Message
  }
};


/**
* This state shows the contents (a message list) of a single folder
*/
const messageListState = {
  name: 'mymessages.messagelist',
  url: '/:folderId',
  // The folderId parameter is part of the URL. This params block sets 'inbox' as the default value.
  // If no parameter value for folderId is provided on the transition, then it will be defaulted to 'inbox'
  params: {folderId: "inbox"},
  resolve: [
    // Fetch the current folder from the Folders service, using the folderId parameter
    {
      token: 'folder',
      deps: ['$transition$'],
      resolveFn: ($transition$) => FoldersStorage.get($transition$.params().folderId),
    },
    // The resolved folder object (from the resolve above) is injected into this resolve
    // The list of message for the folder are fetched from the Messages service
    {
      token: 'messages',
      deps: ['folder'],
      resolveFn: (folder) => MessagesStorage.byFolder(folder),
    }
  ],
  views: {
    // This targets the "messagelist" named UIView added to the DOM in the parent state 'mymessages'
    "messagelist": MessageList
  }
};

export const states = [composeState, messageState, messageListState, mymessagesState];
