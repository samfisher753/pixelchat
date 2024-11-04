
export enum GameEvent {
    StartUi = "start_ui",
    PlayerLoggedIn = "player_logged_in",
    ErrorOnPlayerLogin = "error_on_player_login",
    RoomJoined = "room_joined",
    RoomLeft = "room_left",
    UpdateRoomsList = "update_rooms_list",
    AddMessage = "add_message",
    ToggleRoomsListWindow = "toggle_rooms_list_window",
    UpdateOverlayChat = "update_overlay_chat",
    DrawOverlayChat = "draw_overlay_chat"
}