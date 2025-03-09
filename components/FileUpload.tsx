'use client';

import { IKImage, IKVideo, ImageKitProvider, IKUpload } from 'imagekitio-next';
import { useRef, useState } from 'react';
import config from '@/lib/config';
import Image from 'next/image';
import {
  IKUploadResponse,
  UploadError,
} from 'imagekitio-next/dist/types/components/IKUpload/props';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const {
  env: {
    apiEndpoint,
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  try {
    const response = await fetch(`${apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed to status: ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Failed to authenticate: ' + message);
  }
};

interface Props {
  type: 'image' | 'video';
  accept: string;
  placeholder: string;
  folder: string;
  variant: 'dark' | 'light';
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({
  onFileChange,
  type,
  accept,
  placeholder,
  folder,
  variant,
  value
}: Props) => {
  const ikUploadRef = useRef(null);
  const [file, setFile] = useState<{ filePath: string |null}>({filePath:value??null});
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === 'dark'
        ? 'bg-dark-300'
        : 'bg-light-600 border-gray-100 border',
    placeholder: variant === 'dark' ? 'text-light-100' : 'text-slate-500',
    text: variant === 'dark' ? 'text-light-100' : 'text-dark-400',
  };

  const onError = (error: UploadError) => {
    console.error('アップロード失敗:', error);
    toast(`${type} uploaded failed`);
  };
  // resはIKUploadコンポーネントから提供される成功時のレスポンスデータ
  const onSuccess = (res: IKUploadResponse) => {
    console.log('アップロード成功:', res);
    setFile(res);
    onFileChange(res.filePath); // アップロード成功時に、ファイルパスを親コンポーネントに渡して保存し、フォーム送信時に使用

    toast(`File uploaded successfully`);
  };

  const onValidate = (file: File) => {
    if (type === 'image') {
      if (file.size > 20 * 1024 * 1024) {
        toast(`Image size must be less than 20MB`);
        return false; // ファイルが無効
      }
    } else if (type === 'video') {
      if (file.size > 50 * 1024 * 1024) {
        toast(`Video size must be less than 100MB`);
        return false; // ファイルが無効
      }
    }
    return true; // ファイルが有効
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      {/* アップロード機能 */}
      {/* ユーザーがファイルを選択すると、自動的にImageKitへのアップロード処理を開始 */}
      <IKUpload
        className="hidden" // [ファイルを選択してください]を消す
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName={true}
        validateFile={onValidate}
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) => {
          // loaded: 現在までにアップロードされたバイト数
          // total: ファイルの総バイト数
          const percent = Math.round((loaded / total) * 100);
          // 小数点以下を四捨五入してステートの更新
          setProgress(percent);
        }}
        folder={folder}
        accept={accept}
      />
      <button
        className={cn('upload-btn', styles.button)}
        onClick={(e) => {
          e.preventDefault();

          if (ikUploadRef.current) {
            // @ts-ignore
            // IKUploadの機能を起動（ファイル選択画面が開く）
            ikUploadRef.current?.click();
          }
        }}
      >
        <Image
          src="/icons/upload.svg"
          alt="upload icon"
          width={20}
          height={20}
          className="object-contain"
        />
        <p className={cn('text-base', styles.placeholder)}>{placeholder}</p>
        {file && (
          <p className={cn('upload-filename', styles.text)}>{file.filePath}</p>
        )}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className="w-full rounded-full bg-green-200">
          <div className="progress" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {/* アップロードされた画像のプレビュー */}
      {file &&
        (type === 'image' ? (
          <IKImage
            alt={file.filePath!}
            path={file.filePath!} // アップロードされた画像のパス
            width={500}
            height={300}
          />
        ) : type === 'video' ? (
          <IKVideo
            path={file.filePath!}
            controls
            className="h-96 w-full rounded-xl"
          />
        ) : null)}
    </ImageKitProvider>
  );
};

export default FileUpload;
