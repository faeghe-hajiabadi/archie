// client/src/components/HomeFeed.tsx (REPLACE ENTIRE FILE)
import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Send, Sparkles, X } from "lucide-react";

// --- TypeScript Interfaces ---
interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  imageUrl: string;
  title: string;
  likes: number;
  type: "friend" | "popular";
}

// Keeping the popular posts static for now to mix with our dynamic friend posts
const popularPosts: Post[] = [
  {
    id: "p1",
    authorName: "Vancouver Dog Walkers",
    authorAvatar: "",
    imageUrl: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=600&q=80",
    title: "Huge meetup at Trout Lake this weekend!",
    likes: 342,
    type: "popular"
  }
];

export default function HomeFeed() {
  const [postText, setPostText] = useState("");
  const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image handling state and refs (Visual State)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Fetch posts from the Node.js backend when the component loads
  useEffect(() => {
    fetch('http://localhost:5001/api/posts')
      .then(res => res.json())
      .then(data => setFriendsPosts(data))
      .catch(err => console.error("Failed to fetch posts:", err));
  }, []);

  // --- 2. Handle sending a new post with a real photo to the backend ---
  const handlePostSubmit = async () => {
    if (!postText.trim() && !selectedImage) return; // Don't submit completely empty posts
    
    setIsSubmitting(true);

    // *Crucial Change*: We use FormData instead of JSON to send files
    const formData = new FormData();
    
    // Add the text content
    formData.append('title', postText);
    
    // Add the actual binary file data (naming it 'image' to match Multer on backend)
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const response = await fetch('http://localhost:5001/api/posts', {
        method: 'POST',
        // Note: Do *not* set the Content-Type header! 
        // The browser will automatically set it to 'multipart/form-data' for FormData
        body: formData, 
      });

      if (response.ok) {
        const newPost = await response.json();
        
        // Add the new post to the top of our frontend state
        setFriendsPosts(prevPosts => [newPost, ...prevPosts]);
        
        // Reset the form UI
        setPostText(""); 
        handleRemoveImage();
      } else {
        console.error("Failed to create post on server");
      }
    } catch (error) {
      console.error("Failed to connect to backend:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Triggers the hidden file input
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Grabs the selected file and creates a temporary URL to preview it
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Creates a local preview link
    }
  };

  // Allows the user to clear the selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the input
    }
  };

  // 3. The Unified Feed Logic (Unchanged)
  const unifiedFeed = useMemo(() => {
    const merged: Post[] = [];
    let friendIndex = 0;
    let popularIndex = 0;

    while (friendIndex < friendsPosts.length || popularIndex < popularPosts.length) {
      if (friendIndex < friendsPosts.length) {
        merged.push(friendsPosts[friendIndex]);
        friendIndex++;
      }
      if (popularIndex < popularPosts.length) {
        merged.push(popularPosts[popularIndex]);
        popularIndex++;
      }
    }
    return merged;
  }, [friendsPosts, popularPosts]); 

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      
      {/* Create Post Section */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col gap-3">
              <Textarea 
                placeholder="What's on your mind?" 
                className="resize-none border-none focus-visible:ring-0 px-0 bg-transparent text-lg"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
              
              {/* Image Preview Area */}
              {previewUrl && (
                <div className="relative w-32 h-32 mt-2 rounded-md overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-3">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
                
                {/* Photo Button */}
                <Button 
                // Disable button during submission
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-500 rounded-full"
                  onClick={handlePhotoClick}
                  disabled={isSubmitting}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Photo
                </Button>
                
                <Button 
                  size="sm" 
                  className="rounded-full px-6"
                  onClick={handlePostSubmit}
                  // Enabled if there is text *or* an image selected
                  disabled={isSubmitting || (!postText.trim() && !selectedImage)}
                >
                  {isSubmitting ? "Posting..." : "Post"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Feed Section */}
      <div className="flex flex-col gap-6 mt-2">
        {unifiedFeed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      
    </div>
  );
}

// --- Reusable Post Card Component ---
function PostCard({ post }: { post: Post }) {
  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-sm font-medium">{post.authorName}</CardTitle>
        </div>
        
        {post.type === "popular" && (
          <Badge variant="secondary" className="text-xs font-normal text-slate-500 flex gap-1 items-center">
            <Sparkles className="w-3 h-3" />
            Suggested
          </Badge>
        )}
      </CardHeader>
      
      <div className="w-full aspect-video bg-slate-100">
        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
      </div>
      
      <CardContent className="pt-4">
        <p className="text-sm text-slate-800">{post.title}</p>
        <p className="text-xs text-slate-500 mt-2 font-medium">{post.likes} likes</p>
      </CardContent>
    </Card>
  );
}