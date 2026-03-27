import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon } from "lucide-react";

const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: "Carlos Mendoza",
      username: "@carlosm",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150",
    },
    content: "Sitio web en construcción.",
    likes: 42,
    comments: 12,
    time: "2h",
  },
  {
    id: 2,
    author: {
      name: "Ana Silva",
      username: "@anita_dev",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    },
    content: "Sitio web en construcción.",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800&h=500",
    likes: 128,
    comments: 34,
    time: "5h",
  },
];

export function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post = {
      id: Date.now(),
      author: {
        name: "Mi Usuario",
        username: "@mi_usuario",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
      },
      content: newPost,
      likes: 0,
      comments: 0,
      time: "Ahora",
    };

    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Create Post */}
      <div className="bg-[#2C2C2C] rounded-2xl shadow-lg border border-[#383838] p-4 mb-6">
        <form onSubmit={handlePost}>
          <div className="flex gap-4">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150" 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-[#383838]"
            />
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="¿Qué estás pensando?"
                className="w-full resize-none outline-none text-lg min-h-[80px] bg-transparent text-white placeholder:text-neutral-500"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#383838]">
                <button type="button" className="text-[#4b8df8] p-2 hover:bg-[#383838] rounded-full transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  type="submit"
                  disabled={!newPost.trim()}
                  className="bg-[#022F72] hover:bg-blue-800 text-white px-6 py-2 rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-[#2C2C2C] rounded-2xl shadow-lg border border-[#383838] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border border-[#383838]" />
                <div>
                  <h3 className="font-semibold text-white">{post.author.name}</h3>
                  <p className="text-sm text-neutral-400">{post.author.username} · {post.time}</p>
                </div>
              </div>
              <button className="text-neutral-500 hover:text-white p-1 transition-colors hover:bg-[#383838] rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-neutral-200 text-[15px] mb-3 leading-relaxed">{post.content}</p>
            
            {post.image && (
              <img src={post.image} alt="Post media" className="rounded-xl w-full object-cover mb-4 border border-[#383838] max-h-96" />
            )}

            <div className="flex items-center gap-6 pt-3 border-t border-[#383838]">
              <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-[#383838]"><Heart className="w-5 h-5 group-hover:text-rose-500 transition-colors" /></div>
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              {/*
              <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-[#383838]"><MessageCircle className="w-5 h-5 group-hover:text-blue-400 transition-colors" /></div>
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-[#383838]"><Share2 className="w-5 h-5 group-hover:text-green-400 transition-colors" /></div>
              </button>
              */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedPage;