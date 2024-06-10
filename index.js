// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import {
    extension_prompt_types,
    extension_prompt_roles,
    substituteParams,
    saveSettingsDebounced,
    eventSource,
    event_types,
} from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "sillytavern-actions";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    selected_action: "story",
    action_prompt: "[Enter Adventure Mode. Narrate the story based on {{user}}'s dialogue and actions after \">\". Describe the surroundings in vivid detail. Be detailed, creative, verbose, and proactive. Move the story forward by introducing fantasy elements and interesting characters.]",
    action0_enabled: true,
    action0_useprompt: true,
    action0_name: "Do",
    action0_icon: "fa-person-running",
    action0_template: "> {{msg}}",
    action0_role: "User",

    action1_enabled: true,
    action1_useprompt: true,
    action1_name: "Say",
    action1_icon: "fa-comment",
    action1_template: "> \"{{msg}}\"",
    action1_role: "User",

    action2_enabled: true,
    action2_useprompt: false,
    action2_name: "Story",
    action2_icon: "fa-scroll",
    action2_template: "{{msg}}",
    action2_role: "System",

    action3_enabled: false,
    action3_useprompt: true,
    action3_name: "Later",
    action3_icon: "fa-clock",
    action3_template: "> Later, {{msg}}\r\n*****",
    action3_role: "System",

    action4_enabled: false,
    action4_useprompt: true,
    action4_name: "Action #4",
    action4_icon: "fa-icons",
    action4_template: "{{msg}}",
    action4_role: "User",

    action5_enabled: false,
    action5_useprompt: true,
    action5_name: "Action #5",
    action5_icon: "fa-icons",
    action5_template: "{{msg}}",
    action5_role: "User",

    action6_enabled: false,
    action6_useprompt: true,
    action6_name: "Action #6",
    action6_icon: "fa-icons",
    action6_template: "{{msg}}",
    action6_role: "User",

    action7_enabled: false,
    action7_useprompt: true,
    action7_name: "Action #7",
    action7_icon: "fa-icons",
    action7_template: "{{msg}}",
    action7_role: "User",

    action8_enabled: false,
    action8_useprompt: true,
    action8_name: "Action #8",
    action8_icon: "fa-icons",
    action8_template: "{{msg}}",
    action8_role: "User",

    action9_enabled: false,
    action9_useprompt: true,
    action9_name: "Action #9",
    action9_icon: "fa-icons",
    action9_template: "{{msg}}",
    action9_role: "User",
};

const nullAction = {
    link: undefined,
    name: "None",
    icon: "fa-icons",
    usePrompt: false,
    template: "{{msg}}",
    role: "User",
};

const context = getContext();

let actions = [];

const textarea = document.getElementById('send_textarea');

if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error('Element with id "send_textarea" is not a textarea.');
}

const picker = document.createElement('div');
picker.id = 'actions-button';
picker.classList.add('options-content');

function addAction(id, name, icon, usePrompt, template, role)
{
    name = name || id;
    icon = icon || "fa-icons";
    template = template || "{{msg}}";

    const pickerAction = document.createElement('a');
    pickerAction.id = "action_" + name.toLowerCase();
    pickerAction.innerHTML = '<i class="fa-lg fa-solid ' + icon + '"></i><span data-i18n="'+name+'">'+name+'</span>';
    pickerAction.onclick = () => {
        extension_settings[extensionName].selected_action = name.toLowerCase();
        saveSettingsDebounced();
        updateSelectedAction();
        picker.classList.add('displayNone');
        popper.update();
        textarea.focus();
    };
    picker.appendChild(pickerAction);
    actions.push({
        link: pickerAction,
        name: name,
        icon: icon,
        usePrompt: usePrompt,
        template: template,
        role: role,
    });
    return pickerAction;
}

let currentAction = nullAction;

function updateSelectedAction() {
    selectActionButton.classList = [ 'fa-solid' ];
    context.setExtensionPrompt('action_prompt', '');
    currentAction = nullAction;
    actions.forEach ((item) => {
        item.link.classList.remove("selectedAction");
        if (item.name.toLowerCase() == extension_settings[extensionName].selected_action) {
            currentAction = item;
        }
    });

    if (currentAction.icon == "") {
        selectActionButton.classList.add("fa-icons");
    } else {
        selectActionButton.classList.add(currentAction.icon);
    }
    if (currentAction.link !== undefined) {
        currentAction.link.classList.add("selectedAction");
    }
    if (currentAction.usePrompt) {
        context.setExtensionPrompt('action_prompt', substituteParams("[When you receive the message \"A.\", reply only with the message \"B.\".]"), extension_prompt_types.IN_PROMPT, 4, false, extension_prompt_roles.SYSTEM);
    } else {
        context.setExtensionPrompt('action_prompt', '');
    }
}

const buttonContainer = document.getElementById('leftSendForm');
const selectActionButton = document.createElement('div');
selectActionButton.id = 'selectActionButton';
selectActionButton.title = 'Actions';
selectActionButton.classList.add('fa-solid');
const popper = Popper.createPopper(selectActionButton, picker, {
    placement: 'top-start',
    modifiers: [],
});
picker.classList.add('displayNone');
buttonContainer.appendChild(selectActionButton);
buttonContainer.addEventListener('click', () => {
    picker.classList.toggle('displayNone');
    popper.update();

    if (picker.classList.contains('displayNone')) {
        textarea.focus();
    }
});
document.body.appendChild(picker);
document.body.addEventListener('click', (event) => {
    if (!picker.contains(event.target) && !selectActionButton.contains(event.target)) {
        picker.classList.add('displayNone');
        popper.update();
    }
});
document.body.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
        picker.classList.add('displayNone');
        popper.update();
    }
});

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
    //Create the settings if they don't exist
    let oldSettings = {};
    Object.assign(oldSettings, extension_settings[extensionName] || {});
    Object.assign(extension_settings[extensionName], defaultSettings, oldSettings);

    console.log("extension_settings["+extensionName+"]:", extension_settings[extensionName]);

    // Updating settings in the UI
    for (let i = 0; i < 10; i++) {
        $("#actions_extension_action" + i + "_enabled").prop("checked", extension_settings[extensionName]["action" + i + "_enabled"]).trigger("input");
        $("#actions_extension_action" + i + "_useprompt").prop("checked", extension_settings[extensionName]["action" + i + "_useprompt"]).trigger("input");
        $("#actions_extension_action" + i + "_name").val(extension_settings[extensionName]["action" + i + "_name"]).trigger("input");
        $("#actions_extension_action" + i + "_icon").val(extension_settings[extensionName]["action" + i + "_icon"]).trigger("input");
        $("#actions_extension_action" + i + "_template").val(extension_settings[extensionName]["action" + i + "_template"]).trigger("input");
        $("#actions_extension_action" + i + "_role").val(extension_settings[extensionName]["action" + i + "_role"]).trigger("input");
    }

    $("#actions_extension_prompt").val(extension_settings[extensionName].action_prompt).trigger("input");
}

function onMessageSent(messageIndex)
{
    const message = getContext().chat[messageIndex];
    console.log(message);
    if (currentAction !== undefined)
    {
        message.mes = substituteParams(currentAction.template).replace(/{{msg}}/gi, message.mes);
        switch (currentAction.role.toLowerCase())
        {
            default:
            case "user":      message.is_user = true;  message.is_system = false; break;
            case "assistant": message.is_user = false; message.is_system = false; break;
            case "system":    message.is_user = false; message.is_system = true;  break;
        }
    }
}

function onChatChanged()
{
	const es = extension_settings[extensionName];
    picker.innerHTML = '';
    actions = [];

	for (let i = 0; i < 10; i++)
	{
		if (es["action" + i + "_enabled"])
		{
			addAction("action" + i, es["action" + i + "_name"], es["action" + i + "_icon"], es["action" + i + "_useprompt"], es["action" + i + "_template"], es["action" + i + "_role"]);
		}
	}

    updateSelectedAction();
}

// This function is called when the extension is loaded
jQuery(async () => {
    // This is an example of loading HTML from a file
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

    // Append settingsHtml to extensions_settings
    // extension_settings and extensions_settings2 are the left and right columns of the settings menu
    // Left should be extensions that deal with system functions and right should be visual/UI related
    $("#extensions_settings2").append(settingsHtml);

    // These are examples of listening for events
    for(let i = 0; i < 10; i++) {
        $("#actions_extension_action" + i + "_enabled").on("input", () => { extension_settings[extensionName]["action" + i + "_enabled"] = Boolean($('#actions_extension_action' + i + '_enabled').prop("checked")); onChatChanged(); saveSettingsDebounced(); });
        $("#actions_extension_action" + i + "_useprompt").on("input", () => { extension_settings[extensionName]["action" + i + "_useprompt"] = Boolean($('#actions_extension_action' + i + '_useprompt').prop("checked")); onChatChanged(); saveSettingsDebounced(); });
        $("#actions_extension_action" + i + "_name").on("input", () => { extension_settings[extensionName]["action" + i + "_name"] = $('#actions_extension_action' + i + '_name').val(); onChatChanged(); saveSettingsDebounced(); });
        $("#actions_extension_action" + i + "_icon").on("input", () => { extension_settings[extensionName]["action" + i + "_icon"] = $('#actions_extension_action' + i + '_icon').val(); onChatChanged(); saveSettingsDebounced(); });
        $("#actions_extension_action" + i + "_template").on("input", () => { extension_settings[extensionName]["action" + i + "_template"] = $('#actions_extension_action' + i + '_template').val(); onChatChanged(); saveSettingsDebounced(); });
        $("#actions_extension_action" + i + "_role").on("input", () => { extension_settings[extensionName]["action" + i + "_role"] = $('#actions_extension_action' + i + '_role').val(); onChatChanged(); saveSettingsDebounced(); });
    }

    $("#actions_extension_prompt").on("input", () => { extension_settings[extensionName].action_prompt = $('#actions_extension_prompt').val(); saveSettingsDebounced(); });

    // Load settings when starting things up (if you have any)
    loadSettings();
    onChatChanged();
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
});
