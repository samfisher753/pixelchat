
export enum GameEvent {
    Loading = "loading",
    ErrorOnPlayerLogin = "error_on_player_login",
    RoomJoined = "room_joined",
    RoomLeft = "room_left",
    UpdateRoomsList = "update_rooms_list",
    AddMessage = "add_message",
    UpdateOverlayChat = "update_overlay_chat",
    DrawOverlayChat = "draw_overlay_chat",
    ShowPlayerInfo = "show_player_info",
    HidePlayerInfo = "hide_player_info",
    TokenExpired = "token_expired",
    SocketReady = "socket_ready"
}