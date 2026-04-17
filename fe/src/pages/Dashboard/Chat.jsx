// ChatUI.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    AppBar, Avatar, Badge, Box, Button, Chip, Divider, IconButton, InputAdornment,
    List, ListItemButton, ListItemAvatar, ListItemText, Paper, Stack, TextField,
    Toolbar, Tooltip, Typography
} from "@mui/material";
import {
    Search as SearchIcon,
    Add as AddIcon,
    Send as SendIcon,
    Mic as MicIcon,
    EmojiEmotions as EmojiIcon,
    MoreVert as MoreIcon,
    Phone as PhoneIcon,
    Videocam as VideoIcon
} from "@mui/icons-material";
import MainCard from "@components/MainCard";
import { getConversations, getMessages, sendMessage } from "./ChatServices";
import { useAuth } from "@providers/AuthProvider";
import { useGlobalContext } from "@providers/GlobalProvider";
import { getMediaUrl } from "@utils/mediaUrl";

const railApps = [
    { id: "r1", icon: "https://api.iconify.design/flat-color-icons:shop.svg?width=40" },
    { id: "r2", icon: "https://api.iconify.design/logos:adobe.svg?width=40" },
    { id: "r3", icon: "https://api.iconify.design/logos:google-ads.svg?width=40" },
    { id: "r4", icon: "https://api.iconify.design/logos:google-analytics.svg?width=40" },
    { id: "r5", icon: "https://api.iconify.design/logos:playstation.svg?width=40" },
    { id: "r6", icon: "https://api.iconify.design/logos:shopify.svg?width=40" },
];

const CHAT_POLL_MS = 3000;

/** ---------- helpers ---------- */
const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const toTimestamp = (value) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : Date.now();
};

const normalizeMessage = (message) => ({
    ...message,
    time: toTimestamp(message.created_at),
    text: message.body || message.preview_text || '',
});

const sortMessagesAsc = (items) =>
    [...items].sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at));

const mergeMessages = (current, incoming) => {
    const byId = new Map(current.map((item) => [String(item.id), item]));
    incoming.forEach((item) => {
        byId.set(String(item.id), { ...(byId.get(String(item.id)) || {}), ...item });
    });
    return sortMessagesAsc([...byId.values()]).map(normalizeMessage);
};

const normalizeConversation = (conversation, currentUserId) => {
    const participants = conversation.participants || [];
    const other = participants.find((item) => Number(item.id) !== Number(currentUserId));
    return {
        ...conversation,
        avatar: conversation.type === 'direct' ? getMediaUrl(other?.avatar) : '',
        initials: String(conversation.name || '?').slice(0, 2).toUpperCase(),
        unread: conversation.unread_count || 0,
        last: conversation.latest_message?.preview_text || '',
    };
};

/** ---------- UI pieces ---------- */
function OnlineDot({ size = 10 }) {
    return (
        <Box
            sx={{
                width: size, height: size, borderRadius: "50%",
                bgcolor: "success.main", border: "2px solid white", boxShadow: 1
            }}
        />
    );
}

function MessageBubble({ msg, isMine, avatar }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-end" justifyContent={isMine ? "flex-end" : "flex-start"}>
            {!isMine && (
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color="success"
                >
                <Avatar src={avatar || getMediaUrl(msg.user?.avatar)} sx={{ width: 36, height: 36 }}>
                    {!avatar && !msg.user?.avatar ? msg.user?.name?.[0] : null}
                </Avatar>
                </Badge>
            )}

            <Paper
                elevation={0}
                sx={(t) => ({
                    px: 2, py: 1.25, maxWidth: { xs: "85%", md: "70%" },
                    borderRadius: 3,
                    borderTopLeftRadius: isMine ? 3 : 1,
                    borderTopRightRadius: isMine ? 1 : 3,
                    bgcolor: isMine ? (t.palette.mode === "dark" ? "primary.dark" : "grey.100") : (t.palette.mode === "dark" ? "grey.800" : "common.white"),
                    border: (isMine ? "1px solid" : "1px solid"),
                    borderColor: (t) => (isMine ? t.palette.divider : t.palette.divider)
                })}
            >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                    {msg.text}
                </Typography>
                {msg.attachment_url && (
                    <Box
                        component="img"
                        src={getMediaUrl(msg.attachment_url)}
                        alt={msg.attachment_name || ''}
                        sx={{ display: 'block', mt: msg.text ? 1 : 0, maxWidth: '100%', borderRadius: 1 }}
                    />
                )}
                <Typography variant="caption" color="text.secondary">{formatTime(msg.time)}</Typography>
            </Paper>

            {isMine && (
                <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>Me</Avatar>
            )}
        </Stack>
    );
}

/** ---------- MAIN ---------- */
export default function ChatUI() {
    const { user } = useAuth();
    const { showNotification } = useGlobalContext();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loadingMessages, setLoadingMessages] = useState(false);
    const scrollRef = useRef(null);
    const activeConversation = useMemo(
        () => conversations.find((item) => Number(item.id) === Number(activeConversationId)) || null,
        [conversations, activeConversationId]
    );

    const loadConversations = async ({ silent = false } = {}) => {
        try {
            const res = await getConversations();
            const items = (res.data?.data || []).map((item) => normalizeConversation(item, user?.id));
            setConversations(items);
            setActiveConversationId((current) => current || items[0]?.id || null);
        } catch (err) {
            if (!silent) {
                showNotification(err.response?.data?.message || err.response?.data?.error || 'Không tải được danh sách chat', 'error');
            }
        }
    };

    const loadMessages = async (conversationId, { silent = false } = {}) => {
        if (!conversationId) return;

        if (!silent) {
            setLoadingMessages(true);
        }

        try {
            const res = await getMessages(conversationId, { per_page: 50 });
            const items = res.data?.data?.messages?.data || [];
            setMessages((prev) => mergeMessages(prev, items));

            const updatedConversation = res.data?.data?.conversation;
            if (updatedConversation) {
                setConversations((prev) =>
                    prev.map((item) =>
                        Number(item.id) === Number(updatedConversation.id)
                            ? normalizeConversation(updatedConversation, user?.id)
                            : item
                    )
                );
            }
        } catch (err) {
            if (!silent) {
                showNotification(err.response?.data?.message || err.response?.data?.error || 'Không tải được tin nhắn', 'error');
            }
        } finally {
            if (!silent) {
                setLoadingMessages(false);
            }
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        setMessages([]);
        loadMessages(activeConversationId);
    }, [activeConversationId]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            loadConversations({ silent: true });
            if (activeConversationId) {
                loadMessages(activeConversationId, { silent: true });
            }
        }, CHAT_POLL_MS);

        return () => window.clearInterval(timer);
    }, [activeConversationId, user?.id]);

    // auto-scroll xuống cuối
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages.length]);

    const handleSend = async () => {
        const text = draft.trim();
        if (!text || !activeConversationId) return;

        setDraft("");

        try {
            const res = await sendMessage(activeConversationId, { body: text });
            const savedMessage = res.data?.data;
            if (savedMessage) {
                setMessages((prev) => mergeMessages(prev, [savedMessage]));
            }
            loadConversations({ silent: true });
        } catch (err) {
            setDraft(text);
            showNotification(err.response?.data?.message || err.response?.data?.error || 'Không gửi được tin nhắn', 'error');
        }
    };

    return (
        <MainCard >
            <Box sx={{ height: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "72px 340px 1fr" }, bgcolor: (t) => (t.palette.mode === "dark" ? "background.default" : "grey.50") }}>
                {/* Rail avatar bên trái */}
                <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", alignItems: "center", gap: 2, py: 2, borderRight: (t) => `1px solid ${t.palette.divider}` }}>
                    {railApps.map((r) => (
                        <Box key={r.id} sx={{ position: "relative" }}>
                            <Avatar src={r.icon} variant="rounded" sx={{ width: 44, height: 44, bgcolor: "common.white" }} />
                            <Box sx={{ position: "absolute", right: -2, bottom: -2 }}><OnlineDot /></Box>
                        </Box>
                    ))}
                </Box>

                {/* Danh sách chat */}
                <Box sx={{ borderRight: (t) => `1px solid ${t.palette.divider}`, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search for ..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button fullWidth variant="contained" startIcon={<AddIcon />} sx={{ mt: 2, borderRadius: 2 }}>
                            Start New Chat
                        </Button>
                    </Box>
                    <Divider />
                    <Box sx={{ flex: 1, overflow: "auto" }}>
                        <List dense>
                            {conversations.map((c) => (
                                <ListItemButton
                                    key={c.id}
                                    selected={Number(activeConversationId) === Number(c.id)}
                                    onClick={() => setActiveConversationId(c.id)}
                                    sx={{
                                        borderRadius: 2,
                                        mx: 1,
                                        my: 0.5,
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                            variant="dot"
                                            color="success"
                                        >
                                            {c.avatar ? (
                                                <Avatar src={c.avatar} />
                                            ) : (
                                                <Avatar>{c.initials}</Avatar>
                                            )}
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography component="span" fontWeight={700}>{c.name}</Typography>
                                                {c.unread ? <Chip size="small" label={c.unread} color="error" /> : null}
                                            </Stack>
                                        }
                                        secondary={
                                            <Typography component="span" variant="body2" color="text.secondary" noWrap>
                                                {c.last}
                                            </Typography>
                                        }
                                        primaryTypographyProps={{ component: "div" }}
                                        secondaryTypographyProps={{ component: "div" }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                        {conversations.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3 }}>
                                Chưa có cuộc trò chuyện.
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Khung chat chính */}
                <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    {/* Header */}
                    <AppBar position="static" elevation={0} color="default" sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                        <Toolbar sx={{ gap: 2 }}>
                            <Badge overlap="circular" variant="dot" color="success" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                                <Avatar src={activeConversation?.avatar}>
                                    {!activeConversation?.avatar ? activeConversation?.initials : null}
                                </Avatar>
                            </Badge>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={700} noWrap>
                                    {activeConversation?.name || 'Chat'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {activeConversation?.type === 'group'
                                        ? `${activeConversation?.participants?.length || 0} thành viên`
                                        : 'Tin nhắn trực tiếp'}
                                </Typography>
                            </Box>
                            <Tooltip title="Voice call"><IconButton><PhoneIcon /></IconButton></Tooltip>
                            <Tooltip title="Video call"><IconButton><VideoIcon /></IconButton></Tooltip>
                            <Tooltip title="More"><IconButton><MoreIcon /></IconButton></Tooltip>
                        </Toolbar>
                    </AppBar>

                    {/* Messages */}
                    <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        {messages.map((m) => (
                            <MessageBubble
                                key={m.id}
                                msg={m}
                                isMine={Number(m.user_id) === Number(user?.id)}
                                avatar={activeConversation?.avatar}
                            />
                        ))}
                        {!loadingMessages && activeConversation && messages.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                Chưa có tin nhắn.
                            </Typography>
                        )}
                    </Box>

                    {/* Composer */}
                    <Divider />
                    <Box sx={{ p: 1.5 }}>
                        <Paper
                            elevation={0}
                            sx={(t) => ({
                                p: 1,
                                borderRadius: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                bgcolor: t.palette.background.paper,
                                border: `1px solid ${t.palette.divider}`,
                            })}
                        >
                            <IconButton><MicIcon /></IconButton>
                            <TextField
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Type something ..."
                                disabled={!activeConversation}
                                size="small"
                                fullWidth
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <IconButton onClick={handleSend}><SendIcon /></IconButton>
                                                <IconButton><EmojiIcon /></IconButton>
                                                <IconButton><MoreIcon /></IconButton>
                                            </Stack>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </MainCard>
    );
}
