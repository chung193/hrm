import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem as MuiMenuItem,
    MenuItem,
    Stack,
    TextField,
    Link as MuiLink,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    InsertEmoticon as InsertEmoticonIcon,
    Image as ImageIcon,
    GroupAdd as GroupAddIcon,
    Search as SearchIcon,
    Send as SendIcon,
} from '@mui/icons-material';
import MainCard from '@components/MainCard';
import { useAuth } from '@providers/AuthProvider';
import { useGlobalContext } from '@providers/GlobalProvider';
import { getMediaUrl } from '@utils/mediaUrl';
import { getAllSimple as getUsersSimple } from '@pages/Dashboard/User/UserServices';
import { ensureBrowserNotificationPermission, showBrowserNotification } from '@services/browserNotification';
import { subscribeToConversationPresence, subscribeToUserChannel } from '@services/echo';
import { createChatConversation, getChatConversations, getChatMessages, sendChatMessage } from './ChatServices';

const initialDialogForm = {
    type: 'direct',
    direct_user_id: '',
    name: '',
    participant_ids: [],
};

const QUICK_EMOJIS = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😊', '🙂', '😉', '😍', '🥰',
    '😘', '😎', '🤩', '🥳', '😇', '🤗', '🤔', '🫡', '🤝', '🙏', '👍', '👎',
    '👏', '🙌', '💪', '🔥', '✨', '🎉', '🎊', '💯', '✅', '📌', '❤️', '💙',
    '💚', '💛', '🧡', '💜', '🤍', '🖤', '💔', '😢', '😭', '😤', '😡', '🤯',
    '😴', '🤒', '🤕', '🥶', '🥵', '😬', '🙃', '😶', '🤐', '🥹', '🤭', '🫶',
    '👀', '💬', '📣', '📅', '💼', '🏆', '🎯', '🚀', '💡', '⚡', '🌟', '🌈',
    '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱', '🐈', '🐈‍⬛',
    'ฅ^•⩊•^ฅ', 'ฅ^._.^ฅ', '=^._.^=', '(=^･ω･^=)', '(=^-ω-^=)', '(ᐡ˵• ᵕ •˵ᐡ)', '🐾', '🧶',
];

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const renderMessageContent = (content = '') => {
    const parts = String(content).split(URL_PATTERN);

    return parts.map((part, index) => {
        if (!part) {
            return null;
        }

        if (/^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(part)) {
            const href = part.startsWith('http://') || part.startsWith('https://') ? part : `https://${part}`;

            return (
                <MuiLink
                    key={`${part}-${index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ fontWeight: 600, wordBreak: 'break-all' }}
                >
                    {part}
                </MuiLink>
            );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
    });
};

const appendUniqueMessage = (items, nextMessage) => {
    if (!nextMessage?.id) {
        return items;
    }

    if (items.some((item) => Number(item.id) === Number(nextMessage.id))) {
        return items;
    }

    return [...items, nextMessage].sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
};

function UnreadBadge({ count }) {
    if (!count || Number(count) <= 0) {
        return null;
    }

    const displayValue = Number(count) > 99 ? '99+' : String(count);

    return (
        <Box
            sx={{
                minWidth: 22,
                height: 22,
                px: displayValue.length > 2 ? 0.75 : 0.5,
                borderRadius: 999,
                bgcolor: 'error.main',
                color: 'error.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0,
            }}
        >
            {displayValue}
        </Box>
    );
}

function MessageBubble({ item, isMine }) {
    const resolvedAttachmentUrl = item.attachment_url ? getMediaUrl(item.attachment_url) : '';

    return (
        <Stack alignItems={isMine ? 'flex-end' : 'flex-start'}>
            <Box
                sx={{
                    maxWidth: { xs: '88%', md: '72%' },
                    px: 2,
                    py: 1.25,
                    borderRadius: 2.5,
                    borderTopLeftRadius: isMine ? 2.5 : 1,
                    borderTopRightRadius: isMine ? 1 : 2.5,
                    bgcolor: isMine ? 'primary.main' : 'background.paper',
                    color: isMine ? 'primary.contrastText' : 'text.primary',
                    border: '1px solid',
                    borderColor: isMine ? 'primary.main' : 'divider',
                }}
            >
                {!isMine && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.75 }}>
                        {item.user?.name || 'Không rõ'}
                    </Typography>
                )}
                {resolvedAttachmentUrl ? (
                    <Box
                        component="img"
                        src={resolvedAttachmentUrl}
                        alt={item.attachment_name || 'Chat image'}
                        sx={{
                            width: '100%',
                            maxWidth: 280,
                            maxHeight: 280,
                            display: 'block',
                            objectFit: 'cover',
                            borderRadius: 2,
                            mb: item.body ? 1 : 0,
                            cursor: 'pointer',
                        }}
                        onClick={() => window.open(resolvedAttachmentUrl, '_blank', 'noopener,noreferrer')}
                    />
                ) : null}
                <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {renderMessageContent(item.body)}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.75, opacity: isMine ? 0.8 : 0.65 }}
                >
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                </Typography>
            </Box>
        </Stack>
    );
}

export default function Chat({ mode = 'direct' }) {
    const MESSAGE_PAGE_SIZE = 30;
    const { user } = useAuth();
    const { showNotification, chatState, reloadChatState } = useGlobalContext();
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagePage, setMessagePage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogForm, setDialogForm] = useState(initialDialogForm);
    const [typingUsers, setTypingUsers] = useState([]);
    const [presenceMembers, setPresenceMembers] = useState([]);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState('');
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const whisperTypingRef = useRef(() => {});
    const imageInputRef = useRef(null);
    const prependScrollOffsetRef = useRef(null);

    const scopedConversations = useMemo(() => conversations.filter((item) => item.type === mode), [conversations, mode]);
    const selectedConversation = useMemo(
        () => scopedConversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
        [scopedConversations, selectedConversationId]
    );
    const activeConversation = selectedConversation || scopedConversations[0] || null;
    const activeConversationId = activeConversation?.id || null;

    const filteredConversations = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return scopedConversations;

        return scopedConversations.filter((item) => {
            const haystack = [
                item.name,
                item.latest_message?.body,
                ...(item.participants || []).map((participant) => participant.name),
            ].join(' ').toLowerCase();

            return haystack.includes(keyword);
        });
    }, [scopedConversations, search]);

    const loadConversations = async ({ silent = false } = {}) => {
        if (!silent) setLoadingConversations(true);

        try {
            const response = await getChatConversations();
            const nextItems = response?.data?.data || [];
            setConversations(nextItems);
            setSelectedConversationId((current) => {
                const nextScopedItems = nextItems.filter((item) => item.type === mode);

                if (current && nextScopedItems.some((item) => Number(item.id) === Number(current))) {
                    return current;
                }

                return nextScopedItems[0]?.id || null;
            });
        } catch (error) {
            showNotification(error.response?.data?.message || 'Không thể tải danh sách hội thoại', 'error');
        } finally {
            setLoadingConversations(false);
        }
    };

    const loadMessages = async (conversationId, {
        silent = false,
        page = 1,
        prepend = false,
    } = {}) => {
        if (!conversationId) {
            setMessages([]);
            setMessagePage(1);
            setHasMoreMessages(false);
            return;
        }

        if (prepend) {
            setLoadingOlderMessages(true);
        } else if (!silent) {
            setLoadingMessages(true);
        }

        try {
            if (prepend && scrollRef.current) {
                prependScrollOffsetRef.current = {
                    previousHeight: scrollRef.current.scrollHeight,
                    previousTop: scrollRef.current.scrollTop,
                };
            }

            const response = await getChatMessages(conversationId, { per_page: MESSAGE_PAGE_SIZE, page });
            const nextMessages = response?.data?.data?.messages?.data || [];
            const messageMeta = response?.data?.data?.messages?.meta || {};
            const normalizedMessages = [...nextMessages].reverse();

            setMessages((prev) => prepend
                ? [...normalizedMessages, ...prev.filter((item) => !normalizedMessages.some((nextItem) => Number(nextItem.id) === Number(item.id)))]
                : normalizedMessages
            );
            setMessagePage(Number(messageMeta.current_page || page));
            setHasMoreMessages(Number(messageMeta.current_page || page) < Number(messageMeta.last_page || page));
            reloadChatState?.();
        } catch (error) {
            showNotification(error.response?.data?.message || 'Không thể tải tin nhắn chat', 'error');
        } finally {
            if (prepend) {
                setLoadingOlderMessages(false);
            } else {
                setLoadingMessages(false);
            }
        }
    };

    const loadUsers = async () => {
        try {
            const response = await getUsersSimple();
            const nextUsers = Array.isArray(response?.data?.data) ? response.data.data : [];
            setUsers(nextUsers.filter((item) => Number(item.id) !== Number(user?.id)));
        } catch (error) {
            showNotification(error.response?.data?.message || 'Không thể tải danh sách người dùng', 'error');
        }
    };

    useEffect(() => {
        loadConversations();
        loadUsers();
    }, [mode]);

    useEffect(() => {
        ensureBrowserNotificationPermission().catch(() => null);
    }, []);

    useEffect(() => {
        return () => {
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
            }
        };
    }, [selectedImagePreview]);

    useEffect(() => {
        loadMessages(activeConversationId);
    }, [activeConversationId]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            loadConversations({ silent: true });
        }, 15000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user?.id) {
            return undefined;
        }

        return subscribeToUserChannel(user.id, {
            onConversationCreated: ({ conversation }) => {
                if (!conversation?.id || conversation.type !== mode) return;

                setConversations((prev) => [conversation, ...prev.filter((item) => Number(item.id) !== Number(conversation.id))]);
                setSelectedConversationId((current) => current || conversation.id);

                if (typeof document !== 'undefined' && document.hidden) {
                    showBrowserNotification({
                        title: 'Hội thoại mới',
                        body: `Bạn vừa được thêm vào ${conversation.name || 'một hội thoại'}.`,
                    }).catch(() => null);
                }
            },
            onMessageCreated: ({ conversation, message }) => {
                if (conversation?.id) {
                    setConversations((prev) => [conversation, ...prev.filter((item) => Number(item.id) !== Number(conversation.id))]);
                }

                if (message?.id && Number(message.conversation_id) === Number(activeConversationId)) {
                    setMessages((prev) => appendUniqueMessage(prev, message));
                }

                if (
                    message?.id &&
                    Number(message.user_id) !== Number(user?.id) &&
                    conversation?.type === mode &&
                    typeof document !== 'undefined' &&
                    document.hidden
                ) {
                    showBrowserNotification({
                        title: conversation?.name || message.user?.name || 'Tin nhắn mới',
                        body: message.body || 'Bạn có một tin nhắn mới.',
                    }).catch(() => null);
                }
            },
        });
    }, [activeConversationId, mode, user?.id]);

    useEffect(() => {
        if (!activeConversationId || !user?.id) {
            setPresenceMembers([]);
            setTypingUsers([]);
            return undefined;
        }

        const subscription = subscribeToConversationPresence(activeConversationId, {
            onHere: (members) => {
                setPresenceMembers(members || []);
            },
            onJoining: (member) => {
                setPresenceMembers((prev) => [...prev.filter((item) => Number(item.id) !== Number(member.id)), member]);
            },
            onLeaving: (member) => {
                setPresenceMembers((prev) => prev.filter((item) => Number(item.id) !== Number(member.id)));
                setTypingUsers((prev) => prev.filter((item) => Number(item.id) !== Number(member.id)));
            },
            onTyping: (payload) => {
                if (!payload?.user || Number(payload.user.id) === Number(user.id)) {
                    return;
                }

                if (payload.is_typing) {
                    setTypingUsers((prev) => [...prev.filter((item) => Number(item.id) !== Number(payload.user.id)), payload.user]);
                    return;
                }

                setTypingUsers((prev) => prev.filter((item) => Number(item.id) !== Number(payload.user.id)));
            },
        });

        whisperTypingRef.current = subscription.whisperTyping;

        return () => {
            whisperTypingRef.current = () => {};
            subscription.unsubscribe();
            setTypingUsers([]);
            setPresenceMembers([]);
        };
    }, [activeConversationId, user?.id]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        if (prependScrollOffsetRef.current) {
            const { previousHeight, previousTop } = prependScrollOffsetRef.current;
            element.scrollTop = element.scrollHeight - previousHeight + previousTop;
            prependScrollOffsetRef.current = null;
            return;
        }

        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages.length, selectedConversationId]);

    const handleMessageScroll = () => {
        const element = scrollRef.current;
        if (!element || loadingOlderMessages || loadingMessages || !hasMoreMessages || !activeConversationId) {
            return;
        }

        if (element.scrollTop <= 80) {
            loadMessages(activeConversationId, {
                silent: true,
                page: messagePage + 1,
                prepend: true,
            });
        }
    };

    const handleSend = async () => {
        const body = draft.trim();
        if ((!body && !selectedImage) || !activeConversationId) return;

        setSending(true);
        try {
            const payload = selectedImage
                ? (() => {
                    const formData = new FormData();
                    if (body) {
                        formData.append('body', body);
                    }
                    formData.append('image', selectedImage);
                    return formData;
                })()
                : { body };

            const response = await sendChatMessage(activeConversationId, payload);
            const nextMessage = response?.data?.data;
            setMessages((prev) => appendUniqueMessage(prev, nextMessage));
            setDraft('');
            setSelectedImage(null);
            if (selectedImagePreview) {
                URL.revokeObjectURL(selectedImagePreview);
                setSelectedImagePreview('');
            }
            setTypingUsers([]);
            loadConversations({ silent: true });
        } catch (error) {
            showNotification(error.response?.data?.message || 'Không thể gửi tin nhắn', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleDraftChange = (event) => {
        const nextValue = event.target.value;
        setDraft(nextValue);

        if (!activeConversationId || !user?.id) {
            return;
        }

        whisperTypingRef.current({
            is_typing: nextValue.trim().length > 0,
            user: {
                id: user.id,
                name: user.name,
            },
        });

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            whisperTypingRef.current({
                is_typing: false,
                user: {
                    id: user.id,
                    name: user.name,
                },
            });
        }, 1200);
    };

    const handlePickEmoji = (emoji) => {
        const nextValue = `${draft}${emoji}`;
        setDraft(nextValue);
        setEmojiAnchorEl(null);

        if (!activeConversationId || !user?.id) {
            return;
        }

        whisperTypingRef.current({
            is_typing: true,
            user: {
                id: user.id,
                name: user.name,
            },
        });
    };

    const handleChooseImage = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            showNotification('Chỉ hỗ trợ tệp hình ảnh ở đây', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('Ảnh phải có dung lượng 10MB trở xuống', 'error');
            return;
        }

        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }

        setSelectedImage(file);
        setSelectedImagePreview(URL.createObjectURL(file));
        event.target.value = '';
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedImagePreview('');
    };

    const modeTitle = mode === 'group' ? 'Nhóm chat' : 'Chat trực tiếp';
    const modeEmptyText = mode === 'group'
        ? 'Tạo nhóm chat để bắt đầu trao đổi nội bộ.'
        : 'Tạo cuộc chat trực tiếp để bắt đầu trao đổi 1-1 trong tổ chức.';
    const createPrimaryLabel = mode === 'group' ? 'Tạo nhóm mới' : 'Tạo chat trực tiếp';
    const onlineParticipantIds = useMemo(() => new Set(chatState?.onlineUserIds || []), [chatState?.onlineUserIds]);

    const handleCreateConversation = async () => {
        if (mode === 'direct' && !dialogForm.direct_user_id) {
            showNotification('Vui lòng chọn người dùng', 'error');
            return;
        }

        if (mode === 'group') {
            if (!dialogForm.name.trim()) {
                showNotification('Vui lòng nhập tên nhóm', 'error');
                return;
            }

            if (dialogForm.participant_ids.length === 0) {
                showNotification('Vui lòng chọn ít nhất một thành viên', 'error');
                return;
            }
        }

        try {
            const payload = mode === 'direct'
                ? { type: 'direct', direct_user_id: Number(dialogForm.direct_user_id) }
                : {
                    type: 'group',
                    name: dialogForm.name.trim(),
                    participant_ids: dialogForm.participant_ids.map((id) => Number(id)),
                };

            const response = await createChatConversation(payload);
            const nextConversation = response?.data?.data;
            setDialogOpen(false);
            setDialogForm(initialDialogForm);
            await loadConversations({ silent: true });
            setSelectedConversationId(nextConversation?.id || null);
            showNotification('Đã tạo hội thoại thành công', 'success');
        } catch (error) {
            showNotification(error.response?.data?.message || 'Không thể tạo hội thoại', 'error');
        }
    };

    return (
        <>
            <MainCard
                sx={{
                    '& .MuiCard-root': {
                        overflow: 'hidden',
                    },
                    '& .MuiCardContent-root': {
                        p: 0,
                        '&:last-child': {
                            pb: 0,
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        height: '72vh',
                        minHeight: 560,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
                        overflow: 'hidden',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{modeTitle}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {mode === 'group' ? 'Các nhóm nội bộ trong tổ chức' : 'Hội thoại 1-1 trong tổ chức'}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    {mode !== 'group' && (
                                        <IconButton onClick={() => {
                                            setDialogForm({ ...initialDialogForm, type: 'direct' });
                                            setDialogOpen(true);
                                        }}>
                                            <AddIcon />
                                        </IconButton>
                                    )}
                                    {mode !== 'direct' && (
                                        <IconButton onClick={() => {
                                            setDialogForm({ ...initialDialogForm, type: 'group' });
                                            setDialogOpen(true);
                                        }}>
                                            <GroupAddIcon />
                                        </IconButton>
                                    )}
                                </Stack>
                            </Stack>

                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm hội thoại"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>

                        <Divider />

                        <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 1, minHeight: 0 }}>
                            {loadingConversations ? (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography color="text.secondary">Đang tải hội thoại...</Typography>
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {filteredConversations.map((conversation) => (
                                        <ListItemButton
                                            key={conversation.id}
                                            selected={Number(selectedConversationId) === Number(conversation.id)}
                                            onClick={() => setSelectedConversationId(conversation.id)}
                                            sx={{ mb: 0.75, borderRadius: 2, alignItems: 'flex-start' }}
                                        >
                                            <Avatar sx={{ mr: 1.5 }}>
                                                {String(conversation.name || 'C').slice(0, 1).toUpperCase()}
                                            </Avatar>
                                            <ListItemText
                                                primary={(
                                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                                        <Typography sx={{ fontWeight: 700 }} noWrap>
                                                            {conversation.name}
                                                        </Typography>
                                                        <UnreadBadge count={conversation.unread_count} />
                                                    </Stack>
                                                )}
                                                secondary={(
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {conversation.latest_message?.preview_text || 'Chưa có tin nhắn nào'}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                                            <Chip size="small" variant="outlined" label={conversation.type} />
                                                            {conversation.participants
                                                                .filter((participant) => Number(participant.id) !== Number(user?.id))
                                                                .slice(0, 2)
                                                                .map((participant) => (
                                                                <Chip
                                                                    key={participant.id}
                                                                    size="small"
                                                                    color={onlineParticipantIds.has(Number(participant.id)) ? 'success' : 'default'}
                                                                    variant="outlined"
                                                                    label={participant.name}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Stack>
                                                )}
                                            />
                                        </ListItemButton>
                                    ))}
                                    {!filteredConversations.length && (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography color="text.secondary">Chưa có hội thoại nào.</Typography>
                                        </Box>
                                    )}
                                </List>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
                        {activeConversation ? (
                            <>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
                                >
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {activeConversation.name}
                                        </Typography>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                            {activeConversation.participants.map((participant) => (
                                                <Chip
                                                    key={participant.id}
                                                    size="small"
                                                    label={participant.name}
                                                    color={onlineParticipantIds.has(Number(participant.id)) ? 'success' : 'default'}
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Stack>
                                        {typingUsers.length > 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                {typingUsers.map((item) => item.name).join(', ')} đang nhập...
                                            </Typography>
                                        )}
                                        {typingUsers.length === 0 && presenceMembers.length > 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                {presenceMembers.length} người đang trực tuyến trong hội thoại này
                                            </Typography>
                                        )}
                                    </Box>
                                    <Chip size="small" color="primary" variant="outlined" label={activeConversation.type} />
                                </Stack>

                                <Box
                                    ref={scrollRef}
                                    onScroll={handleMessageScroll}
                                    sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2, bgcolor: 'grey.50', minHeight: 0 }}
                                >
                                    {loadingMessages ? (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <Typography color="text.secondary">Đang tải tin nhắn...</Typography>
                                        </Box>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {loadingOlderMessages && (
                                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                    Đang tải tin nhắn cũ hơn...
                                                </Typography>
                                            )}
                                            {messages.map((item) => (
                                                <MessageBubble
                                                    key={item.id}
                                                    item={item}
                                                    isMine={Number(item.user_id) === Number(user?.id)}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', px: 3 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                        Chưa có hội thoại nào
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        {modeEmptyText}
                                    </Typography>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                setDialogForm({ ...initialDialogForm, type: mode === 'group' ? 'group' : 'direct' });
                                                setDialogOpen(true);
                                            }}
                                        >
                                            {createPrimaryLabel}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            {selectedImagePreview ? (
                                <Box sx={{ mb: 1.5, display: 'inline-flex', position: 'relative' }}>
                                    <Box
                                        component="img"
                                        src={selectedImagePreview}
                                        alt={selectedImage?.name || 'Ảnh đã chọn'}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            objectFit: 'cover',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="inherit"
                                        onClick={clearSelectedImage}
                                        sx={{
                                            position: 'absolute',
                                            top: 6,
                                            right: 6,
                                            minWidth: 0,
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 999,
                                        }}
                                    >
                                        ×
                                    </Button>
                                </Box>
                            ) : null}
                            <Stack direction="row" spacing={1}>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleChooseImage}
                                />
                                <IconButton
                                    color="default"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={!activeConversation || sending}
                                    sx={{ alignSelf: 'flex-end' }}
                                >
                                    <ImageIcon />
                                </IconButton>
                                <IconButton
                                    color="default"
                                    onClick={(event) => setEmojiAnchorEl(event.currentTarget)}
                                    disabled={!activeConversation || sending}
                                    sx={{ alignSelf: 'flex-end' }}
                                >
                                    <InsertEmoticonIcon />
                                </IconButton>
                                <TextField
                                    fullWidth
                                    multiline
                                    maxRows={4}
                                    disabled={!activeConversation || sending}
                                    placeholder={activeConversation ? 'Nhập tin nhắn...' : `Chọn hoặc tạo ${mode === 'group' ? 'một nhóm chat' : 'một cuộc chat trực tiếp'} để bắt đầu trò chuyện`}
                                    value={draft}
                                    onChange={handleDraftChange}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSend}
                                    disabled={!activeConversation || sending || (!draft.trim() && !selectedImage)}
                                    endIcon={<SendIcon />}
                                >
                                    Gửi
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </MainCard>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {mode === 'group' ? 'Tạo nhóm chat' : 'Bắt đầu chat trực tiếp'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {mode === 'direct' ? (
                            <TextField
                                select
                                fullWidth
                                label="Người dùng"
                                value={dialogForm.direct_user_id}
                                onChange={(event) => setDialogForm((prev) => ({ ...prev, direct_user_id: event.target.value }))}
                            >
                                {users.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name || item.email}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    label="Tên nhóm"
                                    value={dialogForm.name}
                                    onChange={(event) => setDialogForm((prev) => ({ ...prev, name: event.target.value }))}
                                />
                                <TextField
                                    select
                                    fullWidth
                                    SelectProps={{ multiple: true }}
                                    label="Thành viên"
                                    value={dialogForm.participant_ids}
                                    onChange={(event) => setDialogForm((prev) => ({ ...prev, participant_ids: event.target.value }))}
                                >
                                    {users.map((item) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.name || item.email}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateConversation}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={emojiAnchorEl}
                open={Boolean(emojiAnchorEl)}
                onClose={() => setEmojiAnchorEl(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: -1,
                            borderRadius: 2,
                            p: 0.5,
                            maxWidth: 360,
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                        gap: 0.5,
                        maxHeight: 260,
                        overflow: 'auto',
                    }}
                >
                    {QUICK_EMOJIS.map((emoji) => (
                        <MuiMenuItem
                            key={emoji}
                            onClick={() => handlePickEmoji(emoji)}
                            sx={{
                                minWidth: 0,
                                justifyContent: 'center',
                                borderRadius: 1.5,
                                fontSize: 24,
                                lineHeight: 1,
                                px: 1,
                                py: 0.75,
                            }}
                        >
                            {emoji}
                        </MuiMenuItem>
                    ))}
                </Box>
            </Menu>
        </>
    );
}
